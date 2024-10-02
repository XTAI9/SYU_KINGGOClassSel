async function scheduleTimer() {
    // 添加meta标签，确保编码正确，避免手机端出现乱码
    const addMeta = () => {
        const head = document.getElementsByTagName('head')[0];
        let metaCharset = document.querySelector('meta[charset]');
        if (!metaCharset) {
            metaCharset = document.createElement('meta');
            metaCharset.setAttribute('charset', 'UTF-8');
            head.appendChild(metaCharset);
        }
        let metaViewport = document.querySelector('meta[name="viewport"]');
        if (!metaViewport) {
            metaViewport = document.createElement('meta');
            metaViewport.setAttribute('name', 'viewport');
            metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
            head.appendChild(metaViewport);
        }
    };

    addMeta(); // 确保meta标签添加以避免编码问题

    // 提示用户输入总周数
    const totalWeek = parseInt(await AISchedulePrompt({
        titleText: '输入学期总周数',
        tipText: '请填写学期的总周数（1-30）',
        defaultText: '20',  // 默认值为20周
        validator: value => {
            const parsed = parseInt(value);
            if (isNaN(parsed) || parsed <= 0 || parsed > 30) {
                return '周数必须是1到30之间的正整数';
            }
            return false;
        }
    }) || '20');

    // 提示用户输入开学日期并转换为字符串（符合规范要求）
    const startSemester = await AISchedulePrompt({
        titleText: '输入开学日期',
        tipText: '请按照 YYYY-MM-DD 格式填写（如2024-09-02）',
        defaultText: '2024-09-02',
        validator: value => {
            const isValidDate = /^\d{4}-\d{2}-\d{2}$/.test(value);
            if (!isValidDate) {
                return '日期格式不正确，请使用 YYYY-MM-DD 格式';
            }
            return false;
        }
    }) || '2024-09-02';  // 保留为字符串格式

    // 设置是否以周日开始（默认否）
    const startWithSunday = false;

    // 是否显示周末
    const showWeekend = await AIScheduleSelect({
        titleText: '是否显示周末？',
        contentText: '请选择是否在课程表中显示周六和周日',
        selectList: ['是', '否'],
    }) === '是';

    // 提示用户选择季节
    const season = await AIScheduleSelect({
        titleText: '选择当前季节',
        contentText: '请选择当前学期的季节',
        selectList: ['冬季', '夏季'],
    });

    // 定义冬季和夏季的时间安排
    const winterSchedule = [
        { section: 1, startTime: '08:00', endTime: '08:45' },
        { section: 2, startTime: '08:55', endTime: '09:40' },
        { section: 3, startTime: '10:00', endTime: '10:45' },
        { section: 4, startTime: '10:55', endTime: '11:40' },
        { section: 5, startTime: '14:00', endTime: '14:45' },
        { section: 6, startTime: '14:55', endTime: '15:40' },
        { section: 7, startTime: '16:00', endTime: '16:45' },
        { section: 8, startTime: '16:55', endTime: '17:40' },
        { section: 9, startTime: '19:00', endTime: '20:00' },
        { section: 10, startTime: '20:00', endTime: '21:00' }
    ];

    const summerSchedule = [
        { section: 1, startTime: '08:00', endTime: '08:45' },
        { section: 2, startTime: '08:55', endTime: '09:40' },
        { section: 3, startTime: '10:00', endTime: '10:45' },
        { section: 4, startTime: '10:55', endTime: '11:40' },
        { section: 5, startTime: '14:30', endTime: '15:15' },
        { section: 6, startTime: '15:25', endTime: '16:10' },
        { section: 7, startTime: '16:30', endTime: '17:15' },
        { section: 8, startTime: '17:25', endTime: '18:10' },
        { section: 9, startTime: '19:30', endTime: '20:30' },
        { section: 10, startTime: '20:30', endTime: '21:30' }
    ];

    // 根据用户选择的季节设置时间表
    const sections = season === '冬季' ? winterSchedule : summerSchedule;

    // 动态计算 forenoon, afternoon, night 的节数
    const forenoon = sections.filter(s => s.startTime < '12:00').length;
    const afternoon = sections.filter(s => s.startTime >= '12:00' && s.startTime < '18:00').length;
    const night = sections.filter(s => s.startTime >= '18:00').length;

    // 返回根据用户输入的时间表设置
    return {
        totalWeek,
        startSemester,  // 保持为字符串格式
        startWithSunday,
        showWeekend,
        forenoon,
        afternoon,
        night,
        sections
    };
}
