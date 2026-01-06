// 快捷服务配置数据
const DEFAULT_QUICK_ACTIONS = ['repair', 'visitor', 'contacts', 'announcements']

const ALL_AVAILABLE_ACTIONS = [
  { id: 'repair', name: '报事报修', icon: 'setting-o', url: '/pages/repair/repair', action: 'repair' },
  { id: 'visitor', name: '访客邀请', icon: 'friends-o', url: '/pages/services/visitor/visitor' },
  { id: 'contacts', name: '常用电话', icon: 'phone-o', url: '/pages/services/contacts/contacts', action: 'call' },
  { id: 'announcements', name: '社区公告', icon: 'volume-o', url: '/pages/services/announcements/announcements' },
  { id: 'coupon', name: '优惠券', icon: 'coupon-o', url: '/pages/coupon/list/list' },
  { id: 'house', name: '房屋管理', icon: 'home-o', url: '/pages/house/index/index' }
]

const MAX_SELECTED = 4

Page({
  data: {
    allActions: [],
    selectedIds: [],
    maxSelected: MAX_SELECTED
  },

  onLoad() {
    this.loadConfig()
  },

  loadConfig() {
    const savedConfig = wx.getStorageSync('quickActionsConfig')
    // 如果本地存储为空或者空数组，使用默认配置
    const selectedIds = (savedConfig && savedConfig.length > 0) ? savedConfig : DEFAULT_QUICK_ACTIONS
    console.log('加载配置:', savedConfig, '使用:', selectedIds)
    this.setData({ selectedIds }, () => {
      this.updateAllActions()
    })
  },

  updateAllActions() {
    const allActions = ALL_AVAILABLE_ACTIONS.map(action => ({
      ...action,
      selected: this.data.selectedIds.indexOf(action.id) !== -1
    }))
    console.log('更新 allActions:', allActions.map(a => ({ id: a.id, name: a.name, selected: a.selected })))
    this.setData({ allActions })
  },

  onToggleAction(e) {
    const id = e.currentTarget.dataset.id
    console.log('点击:', id, '当前选中:', this.data.selectedIds)
    let selectedIds = [...this.data.selectedIds]

    const index = selectedIds.indexOf(id)
    if (index > -1) {
      // 取消选中
      selectedIds.splice(index, 1)
    } else {
      // 选中
      if (selectedIds.length >= MAX_SELECTED) {
        wx.showToast({
          title: `最多选择${MAX_SELECTED}个快捷服务`,
          icon: 'none'
        })
        return
      }
      selectedIds.push(id)
    }

    console.log('更新后:', selectedIds)
    this.setData({ selectedIds }, () => {
      this.updateAllActions()
    })
  },

  onSave() {
    if (this.data.selectedIds.length === 0) {
      wx.showToast({
        title: '请至少选择1个快捷服务',
        icon: 'none'
      })
      return
    }

    wx.setStorageSync('quickActionsConfig', this.data.selectedIds)

    // 通知首页刷新
    const pages = getCurrentPages()
    const indexPage = pages.find(page => page.route === 'pages/index/index')
    if (indexPage) {
      indexPage.loadQuickActionsConfig()
    }

    wx.showToast({
      title: '保存成功',
      icon: 'success'
    })

    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  }
})
