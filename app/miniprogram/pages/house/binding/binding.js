const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    communityName: '智慧社区',
    building: '',
    unit: '',
    room: '',
    identity: '',
    identityText: '',
    name: '',
    phone: '',
    idCard: '',
    loading: false,
    showPicker: false,
    pickerTitle: '',
    currentColumns: [],
    pickerType: '',
    buildings: [],    // 从后端获取的楼栋列表
    units: [],        // 从后端获取的单元列表
    rooms: []         // 从后端获取的房号列表
  },

  onLoad() {
    this.loadCommunityInfo()
    this.loadBuildingOptions()
  },

  loadCommunityInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.community_name) {
      this.setData({ communityName: userInfo.community_name })
    }
  },

  // 从后端加载楼栋选项
  loadBuildingOptions() {
    wx.request({
      url: API_BASE_URL + '/property/house/options/buildings',
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({ buildings: res.data.data || [] })
          console.log('楼栋列表加载成功:', this.data.buildings)
        }
      },
      fail: (err) => {
        console.error('加载楼栋列表失败:', err)
      }
    })
  },

  // 从后端加载单元选项
  loadUnitOptions(building) {
    if (!building) return

    wx.request({
      url: API_BASE_URL + '/property/house/options/units',
      method: 'GET',
      data: { building: building },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({ units: res.data.data || [] })
          console.log('单元列表加载成功:', this.data.units)
        }
      },
      fail: (err) => {
        console.error('加载单元列表失败:', err)
      }
    })
  },

  // 从后端加载房号选项
  loadRoomOptions(building, unit) {
    if (!building || !unit) return

    wx.request({
      url: API_BASE_URL + '/property/house/options/rooms',
      method: 'GET',
      data: { building: building, unit: unit },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          this.setData({ rooms: res.data.data || [] })
          console.log('房号列表加载成功:', this.data.rooms)
        }
      },
      fail: (err) => {
        console.error('加载房号列表失败:', err)
      }
    })
  },

  onNameChange(e) {
    const value = e.detail || e.detail.value || ''
    this.setData({ name: value })
  },

  onPhoneChange(e) {
    const value = e.detail || e.detail.value || ''
    this.setData({ phone: value })
  },

  onIdCardChange(e) {
    const value = e.detail || e.detail.value || ''
    this.setData({ idCard: value })
  },

  showBuildingPicker() {
    if (this.data.buildings.length === 0) {
      wx.showToast({
        title: '楼栋列表加载中，请稍候',
        icon: 'none'
      })
      return
    }

    this.setData({
      showPicker: true,
      pickerTitle: '选择楼栋',
      pickerType: 'building',
      currentColumns: this.data.buildings
    })
  },

  showUnitPicker() {
    if (!this.data.building) {
      wx.showToast({
        title: '请先选择楼栋',
        icon: 'none'
      })
      return
    }

    if (this.data.units.length === 0) {
      wx.showToast({
        title: '单元列表加载中，请稍候',
        icon: 'none'
      })
      return
    }

    this.setData({
      showPicker: true,
      pickerTitle: '选择单元',
      pickerType: 'unit',
      currentColumns: this.data.units
    })
  },

  showRoomPicker() {
    if (!this.data.unit) {
      wx.showToast({
        title: '请先选择单元',
        icon: 'none'
      })
      return
    }

    if (this.data.rooms.length === 0) {
      wx.showToast({
        title: '房号列表加载中或已全部绑定',
        icon: 'none'
      })
      return
    }

    this.setData({
      showPicker: true,
      pickerTitle: '选择房号',
      pickerType: 'room',
      currentColumns: this.data.rooms
    })
  },

  showIdentityPicker() {
    this.setData({
      showPicker: true,
      pickerTitle: '选择申请身份',
      pickerType: 'identity',
      currentColumns: [
        { text: '业主', value: 1 },
        { text: '家庭成员', value: 2 },
        { text: '租客', value: 3 }
      ]
    })
  },

  onPickerCancel() {
    this.setData({ showPicker: false })
  },

  onPickerConfirm(e) {
    console.log('Picker confirm event:', e.detail)
    const { value, index } = e.detail
    const { pickerType, currentColumns } = this.data

    let selectedValue = ''
    let displayValue = ''  // 用于显示的文字

    // Vant Weapp Picker 返回的 index 是正确的0-based索引
    if (index !== undefined && index !== null) {
      const actualIndex = index
      console.log('Picker index:', actualIndex)

      if (Array.isArray(currentColumns) && actualIndex >= 0 && actualIndex < currentColumns.length) {
        const item = currentColumns[actualIndex]
        console.log('Selected item:', item)

        if (typeof item === 'object') {
          selectedValue = item.value !== undefined ? item.value : item.text
          displayValue = item.text || item.value  // 优先使用 text 作为显示
        } else {
          selectedValue = item
          displayValue = item
        }
      }
    }

    console.log('Selected value:', selectedValue, 'Display value:', displayValue)

    if (pickerType === 'building') {
      this.setData({ building: displayValue })  // 显示文字
      // 选择楼栋后，清空单元和房号，并加载单元列表
      this.setData({ unit: '', room: '' })
      this.loadUnitOptions(displayValue)
    } else if (pickerType === 'unit') {
      this.setData({ unit: displayValue })  // 显示文字
      // 选择单元后，清空房号，并加载房号列表
      this.setData({ room: '' })
      this.loadRoomOptions(this.data.building, displayValue)
    } else if (pickerType === 'room') {
      this.setData({ room: displayValue })  // 显示文字
    } else if (pickerType === 'identity') {
      this.setData({ identity: selectedValue, identityText: displayValue })  // 保存数字和文字
    }

    this.setData({ showPicker: false })
  },

  onSubmit() {
    const { building, unit, room, identity, name, phone, idCard } = this.data

    console.log('Form data:', { building, unit, room, identity, name, phone, idCard })

    if (!building || !unit || !room || !identity) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    if (!name || !phone) {
      wx.showToast({
        title: '请填写申请人信息',
        icon: 'none'
      })
      return
    }

    const userInfo = wx.getStorageSync('userInfo')
    console.log('User info:', userInfo)

    if (!userInfo || !userInfo.user_id) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    this.setData({ loading: true })

    const requestData = {
      user_id: parseInt(userInfo.user_id),
      building_name: building,
      unit_name: unit,
      room_number: room,
      identity: parseInt(identity),
      applicant_name: name,
      applicant_phone: phone,
      id_card_number: idCard
    }

    console.log('Request data:', requestData)

    wx.request({
      url: API_BASE_URL + '/property/house/binding/apply',
      method: 'POST',
      data: requestData,
      header: {
        'Authorization': 'Bearer ' + (userInfo.token || ''),
        'Content-Type': 'application/json'
      },
      success: (res) => {
        console.log('Response:', res)
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({
            title: '绑定成功',
            icon: 'success'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          const errorMsg = res.data?.message || '绑定失败'
          wx.showToast({
            title: errorMsg,
            icon: 'none'
          })
        }
      },
      fail: (err) => {
        console.error('Request failed:', err)
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        })
      },
      complete: () => {
        this.setData({ loading: false })
      }
    })
  }
})