const express = require("express");
const { LessThanOrEqual, MoreThan, IsNull } = require("typeorm");
const { param } = require("express-validator");

const { dataSource } = require("../db");
const { catchAsync, AppError } = require("../utils");
const { authenticate, validate } = require("../middleware");
const {
	ERROR_MESSAGE: { ID_INVALID, COURSE_NOT_FOUND, ALREADY_BOOKED },
} = require("../constants");

const router = express.Router();

const courseRepository = dataSource.getRepository("Course");
const bookingRepository = dataSource.getRepository("Booking");

router.get(
	"/",
	catchAsync(async (_req, res) => {
		const now = new Date();
		const foundCourses = await courseRepository.find({
			select: {
				id: true,
				name: true,
				description: true,
				start_at: true,
				end_at: true,
				max_participants: true,
				user: { name: true },
				skill: { name: true },
			},
			where: {
				start_at: LessThanOrEqual(now),
				end_at: MoreThan(now),
			},
			relations: {
				user: true,
				skill: true,
			},
			order: {
				start_at: "asc",
				end_at: "asc",
			},
		});

		return res.json({
			status: "success",
			data: foundCourses.map(({ user, skill, ...rest }) => ({
				...rest,
				coach_name: user.name,
				skill_name: skill.name,
			})),
		});
	}),
);

router.post(
	"/:courseId",
	authenticate,
	param("courseId", ID_INVALID).isUUID(),
	validate,
	catchAsync(async (req, res) => {
		const { id: userId } = req.user;
		const { courseId } = req.params;

		await dataSource.transaction(async (manager) => {
			const txUserRepository = manager.getRepository("User");
			const txCourseRepository = manager.getRepository("Course");
			const txBookingRepository = manager.getRepository("Booking");
			const txPurchaseRepository = manager.getRepository("Purchase");

			// 只為了拿鎖：同一個人的報名請求在這裡排隊（保護堂數）
			await txUserRepository.findOne({
				select: { id: true },
				where: { id: userId },
				lock: { mode: "for_no_key_update" },
			});

			const lockedCourse = await txCourseRepository.findOne({
				select: { id: true, max_participants: true },
				where: { id: courseId },
				lock: { mode: "for_no_key_update" },
			});

			if (lockedCourse === null) {
				throw new AppError(400, COURSE_NOT_FOUND);
			}

			const isBookingExisted = await txBookingRepository.existsBy({
				user: { id: userId },
				course: { id: courseId },
			});

			if (isBookingExisted) {
				throw new AppError(400, ALREADY_BOOKED);
			}

			const totalPurchasedCredits = await txPurchaseRepository.sum(
				"purchased_credits",
				{ user: { id: userId } },
			);
			const userActiveBookingsCount = await txBookingRepository.countBy({
				user: { id: userId },
				cancelled_at: IsNull(),
			});

			if ((totalPurchasedCredits ?? 0) - userActiveBookingsCount <= 0) {
				throw new AppError(400, "已無可使用堂數");
			}

			const courseActiveBookingsCount = await txBookingRepository.countBy({
				course: { id: courseId },
				cancelled_at: IsNull(),
			});

			if (courseActiveBookingsCount >= lockedCourse.max_participants) {
				throw new AppError(400, "已達最大參加人數，無法參加");
			}

			await txBookingRepository.save({
				user: { id: userId },
				course: { id: courseId },
			});
		});

		return res.status(201).json({
			status: "success",
			data: null,
		});
	}),
);

router.delete(
	"/:courseId",
	authenticate,
	param("courseId", ID_INVALID).isUUID(),
	validate,
	catchAsync(async (req, res, next) => {
		const { id: userId } = req.user;
		const { courseId } = req.params;

		const updateResult = await bookingRepository.update(
			{
				user: {
					id: userId,
				},
				course: {
					id: courseId,
				},
				cancelled_at: IsNull(),
			},
			{ cancelled_at: new Date() },
		);

		if (updateResult.affected === 0) {
			return next(new AppError(400, "沒有可取消的報名紀錄"));
		}

		return res.json({
			status: "success",
			data: null,
		});
	}),
);

module.exports = router;
