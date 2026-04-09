-- 已有库执行一次：为行程增加装备清单 JSON 列（新建库已由 schema.sql 包含）
ALTER TABLE trip_documents ADD COLUMN packing_list_json TEXT;
