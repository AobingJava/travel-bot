import { z } from "zod";

const themeEnum = z.enum([
  "culture",
  "food",
  "shopping",
  "nature",
  "nightlife",
  "family",
]);

export const createTripSchema = z
  .object({
    destination: z.string().trim().min(2, "请输入目的地").max(80, "目的地过长"),
    startDate: z.string().date("请输入出发日期"),
    endDate: z.string().date("请输入返回日期"),
    travelerCount: z.coerce
      .number()
      .int("人数必须为整数")
      .min(1, "至少 1 人")
      .max(20, "人数最多 20 人"),
    themes: z.array(themeEnum).min(1, "至少选择一个旅行主题"),
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: "返回日期不能早于出发日期",
    path: ["endDate"],
  });

export const inviteMemberSchema = z.object({
  email: z.string().trim().email("请输入有效邮箱"),
  name: z
    .string()
    .trim()
    .max(60, "姓名过长")
    .optional()
    .or(z.literal("")),
});

export const updateTaskSchema = z.object({
  status: z.enum(["open", "done"]),
});

export const magicLinkRequestSchema = z.object({
  email: z.string().trim().email("请输入有效邮箱"),
  name: z.string().trim().max(60, "姓名过长").optional().or(z.literal("")),
  redirectTo: z
    .string()
    .trim()
    .startsWith("/", "跳转地址必须是站内路径")
    .optional()
    .or(z.literal("")),
});
