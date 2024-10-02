function scheduleHtmlParser(providerRes) {
    let result = {
        courseInfos: []
    };

    // 解析来自 provider 的 JSON 数据
    const courses = JSON.parse(providerRes);
    console.info("解析到的课程数据:", courses);

    // 遍历解析到的课程数据
    courses.forEach(course => {
        const name = course.name || "未知课程";
        const teacher = course.teacher || "未知教师";
        const position = course.position || "未知教室";
        const day = buildDay(course.day);  // 调用 buildDay 函数处理星期

        // 默认第 1-2 节，如果 sections 为空或不存在，使用默认值
        const sections = course.sections && course.sections.length ? course.sections : [1, 2];

        // 默认 1-16 周
        const weeks = buildWeeks(course.weeks && course.weeks.length ? course.weeks : "1-16");

        // 打印解析的字段信息
        console.log(`解析课程: ${name}, 教师: ${teacher}, 节次: ${sections}, 周次: ${weeks}, 星期: ${day}`);

        // 将解析出的课程信息推入结果数组
        result.courseInfos.push({
            name,
            teacher,
            position,
            day,
            sections,
            weeks
        });
    });

    return result;
}

// 修复后的 buildDay 函数，确保 dayStr 是一个字符串或数字
function buildDay(dayStr) {
    // 如果 dayStr 不是字符串或数字，返回默认值 1
    if (typeof dayStr !== 'string' && typeof dayStr !== 'number') {
        console.warn(`Invalid dayStr received: ${dayStr}, using default value 1`);
        return 1; // 默认返回星期一
    }

    // 如果 dayStr 是数字，直接返回（确保在 1-7 之间）
    if (typeof dayStr === 'number') {
        return dayStr >= 1 && dayStr <= 7 ? dayStr : 1; // 确保数字在 1-7 之间
    }

    // 构建星期映射表
    const dayMap = new Map([
        ["一", 1],
        ["二", 2],
        ["三", 3],
        ["四", 4],
        ["五", 5],
        ["六", 6],
        ["天", 7],
    ]);

    // 确保 dayStr 是有效的字符串
    dayStr = dayStr.replace(" ", "").replace("周", "").replace("星期", "").replace("日", "天");

    return dayMap.get(dayStr) || 7; // 返回对应的星期值，默认为星期日（7）
}

// 构建周次函数
function buildWeeks(weekStr) {
    if (!weekStr || typeof weekStr !== 'string') {
        console.error("Invalid weekStr, expected a string but received:", weekStr);
        return [];  // 返回空数组，避免错误
    }

    const ret = [];
    let flag = 0;

    if (weekStr.includes("单")) {
        flag = 1;  // 单周
    } else if (weekStr.includes("双")) {
        flag = 2;  // 双周
    }

    // 清理 weekStr 中的标识符，留下纯数字
    weekStr = weekStr
        .replace("周", "")
        .replace("单", "")
        .replace("双", "")
        .replace(" ", "");

    const weekList = weekStr.split(",");

    for (const v of weekList) {
        const se = v.split("-");
        if (se.length === 2) {
            const s = parseInt(se[0]);
            const e = parseInt(se[1]);
            for (let i = s; i <= e; i++) {
                if (flag === 1 && i % 2 !== 0) {
                    ret.push(i);  // 处理单周
                } else if (flag === 2 && i % 2 === 0) {
                    ret.push(i);  // 处理双周
                } else if (flag === 0) {
                    ret.push(i);  // 普通周
                }
            }
        } else {
            const i = parseInt(se[0]);
            if (!isNaN(i)) {
                ret.push(i);
            }
        }
    }
    return ret;
}

// 构建节次函数
function buildSections(sectionStr) {
    const ret = [];
    const se = sectionStr.replace("节", "").split("-");
    if (se.length === 2) {
        const s = parseInt(se[0]);
        const e = parseInt(se[1]);
        for (let i = s; i <= e; i++) {
            ret.push(i);
        }
    } else {
        const i = parseInt(se[0]);
        if (!isNaN(i)) {
            ret.push(i);
        }
    }
    return ret;
}
