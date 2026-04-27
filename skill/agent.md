我们有以下三个表，表是supabase类型的。
-- ==========================================
-- 1. 学生测试信息表
-- ==========================================
CREATE TABLE IF NOT EXISTS student_test (
    id SERIAL PRIMARY KEY, -- SERIAL 替代 INT AUTO_INCREMENT
    student_id VARCHAR(20) NOT NULL,
    name VARCHAR(50) NOT NULL,
    gender VARCHAR(5) NOT NULL,
    college VARCHAR(100) NOT NULL,
    class_name VARCHAR(50) NOT NULL,
    id_number VARCHAR(30) NOT NULL,
    exam_number VARCHAR(30) NOT NULL,
    test_date DATE NOT NULL,
    report_time TIME NOT NULL
);

-- 添加表和字段注释 (PostgreSQL 独立语法)
COMMENT ON TABLE student_test IS '学生测试信息表';
COMMENT ON COLUMN student_test.id IS '自增主键';
COMMENT ON COLUMN student_test.student_id IS '学号';
COMMENT ON COLUMN student_test.name IS '姓名';
COMMENT ON COLUMN student_test.gender IS '性别';
COMMENT ON COLUMN student_test.college IS '学院';
COMMENT ON COLUMN student_test.class_name IS '班级';
COMMENT ON COLUMN student_test.id_number IS '身份证';
COMMENT ON COLUMN student_test.exam_number IS '准考证号';
COMMENT ON COLUMN student_test.test_date IS '测试日期';
COMMENT ON COLUMN student_test.report_time IS '报到时间';

-- 索引
CREATE INDEX IF NOT EXISTS idx_student_test_lookup ON student_test (student_id, id_number);


-- ==========================================
-- 2. 学生测试历史表
-- ==========================================
CREATE TABLE IF NOT EXISTS student_history (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    name VARCHAR(50) NOT NULL,
    gender VARCHAR(5) NOT NULL,
    college VARCHAR(100) NOT NULL,
    class_name VARCHAR(50) NOT NULL,
    id_number VARCHAR(30) NOT NULL,
    exam_number VARCHAR(30) NOT NULL,
    test_date DATE NOT NULL,
    report_time TIME NOT NULL,
    copied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source_id INT
);

-- 注释
COMMENT ON TABLE student_history IS '学生测试历史表';
COMMENT ON COLUMN student_history.id IS '自增主键';
COMMENT ON COLUMN student_history.student_id IS '学号';
COMMENT ON COLUMN student_history.name IS '姓名';
COMMENT ON COLUMN student_history.gender IS '性别';
COMMENT ON COLUMN student_history.college IS '学院';
COMMENT ON COLUMN student_history.class_name IS '班级';
COMMENT ON COLUMN student_history.id_number IS '身份证';
COMMENT ON COLUMN student_history.exam_number IS '准考证号';
COMMENT ON COLUMN student_history.test_date IS '测试日期';
COMMENT ON COLUMN student_history.report_time IS '报到时间';
COMMENT ON COLUMN student_history.copied_at IS '复制时间';
COMMENT ON COLUMN student_history.source_id IS '原表ID';


-- ==========================================
-- 3. 设置日期表
-- ==========================================
CREATE TABLE IF NOT EXISTS student_sz (
    start_date DATE NOT NULL,
    end_date DATE NOT NULL
);

-- 注释
COMMENT ON TABLE student_sz IS '设置日期表';
COMMENT ON COLUMN student_sz.start_date IS '开始日期';
COMMENT ON COLUMN student_sz.end_date IS '结束日期';
请根据以上三个表，创建一个网站，功能主要有以下几点：
1、数据导入功能，通过excel表，将数据导入上面的第一个表student_test表中，导入功能可以通过选取excel文件，将文件中的数据导入数据包含学号、姓名、性别、学院、班级、身份证号、准考证号、测试日期、报到时间。
2、数据浏览功能，显示上面的第一个表student_test表中的所有数据，可以按每页10行、20行、50行、100行显示，可以按学号、姓名、测试日期进行查询。
3、查询日期设置功能，可以对上面第三个表 student_sz的开始日期和结束日期进行设置。
4、数据复制和清除功能，数据复制功能主要是将上面第一个表student_test的数据复制到第二个表student_history中，清除功能是清除上面第一个表student_test的数据。