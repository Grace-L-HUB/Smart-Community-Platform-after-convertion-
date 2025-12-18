// pages/services/announcement-detail/announcement-detail.ts
Page({
    data: {
        id: 0,
        isTop: true,
        category: '物业通知',
        title: '关于小区正在进行绿化维护的通知',
        publishTime: '2024-12-18 10:00',
        views: 256,
        content: '<p>尊敬的各位业主：</p><p>为提升小区环境质量，营造更加舒适宜居的生活空间，物业公司决定对小区绿化进行全面维护。现将有关事项通知如下：</p><p><strong>一、维护时间</strong></p><p>2024年12月20日（本周三）上午9:00-12:00</p><p><strong>二、维护范围</strong></p><p>1. 修剪小区内所有绿化带<br/>2. 清理枯枝落叶<br/>3. 补种部分花草<br/>4. 施肥养护</p><p><strong>三、注意事项</strong></p><p>1. 维护期间请勿在绿化带内停留<br/>2. 请将车辆停放在指定位置<br/>3. 如有不便，敬请谅解</p><p>感谢各位业主的理解与支持！</p>',
        attachments: [
            { id: 1, name: '绿化维护方案.pdf', url: '' },
            { id: 2, name: '施工平面图.jpg', url: '' }
        ],
        publisher: '阳光花园物业管理处'
    },

    onLoad(options: any) {
        if (options.id) {
            this.setData({ id: options.id });
            this.loadAnnouncementDetail(options.id);
        }

        // 增加浏览量
        this.increaseViews();
    },

    loadAnnouncementDetail(id: string) {
        // TODO: 加载公告详情
        console.log('Loading announcement detail:', id);
    },

    increaseViews() {
        // TODO: 增加浏览量
        console.log('Increase views');
    },

    onDownload(event: any) {
        const url = event.currentTarget.dataset.url;
        wx.showToast({
            title: '下载功能开发中',
            icon: 'none'
        });
        // TODO: 下载附件
        console.log('Download:', url);
    },

    onShareAppMessage() {
        return {
            title: this.data.title,
            path: `/pages/services/announcement-detail/announcement-detail?id=${this.data.id}`
        };
    }
});
