const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    communityName: '智慧社区',
    building: '',
    unit: '',
    room: '',
    identity: '',
    name: '',
    phone: '',
    idCard: '',
    loading: false,
    showPicker: false,
    pickerTitle: '',
    currentColumns: [],
    pickerType: ''
  },

  onLoad() {
    this.loadCommunityInfo()
  },

  loadCommunityInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo && userInfo.community_name) {
      this.setData({ communityName: userInfo.community_name })
    }
  },

  onNameChange(e) {
    console.log('Name change:', e.detail)
    const value = e.detail || e.detail.value || ''
    this.setData({ name: value })
  },

  onPhoneChange(e) {
    console.log('Phone change:', e.detail)
    const value = e.detail || e.detail.value || ''
    this.setData({ phone: value })
  },

  onIdCardChange(e) {
    console.log('IdCard change:', e.detail)
    const value = e.detail || e.detail.value || ''
    this.setData({ idCard: value })
  },

  showBuildingPicker() {
    const buildings = []
    for (let i = 1; i <= 20; i++) {
      buildings.push(`${i}栋`)
    }
    
    this.setData({
      showPicker: true,
      pickerTitle: '选择楼栋',
      pickerType: 'building',
      currentColumns: buildings
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
    
    const units = []
    for (let i = 1; i <= 6; i++) {
      units.push(`${i}单元`)
    }
    
    this.setData({
      showPicker: true,
      pickerTitle: '选择单元',
      pickerType: 'unit',
      currentColumns: units
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
    
    const rooms = []
    for (let i = 1; i <= 30; i++) {
      rooms.push(`${i}室`)
    }
    
    this.setData({
      showPicker: true,
      pickerTitle: '选择房号',
      pickerType: 'room',
      currentColumns: rooms
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
    const { value, selectedOptions, index } = e.detail
    const { pickerType } = this.data
    
    let selectedValue = ''
    
    console.log('Picker value:', value)
    console.log('Picker selectedOptions:', selectedOptions)
    console.log('Picker index:', index)
    
    if (selectedOptions && selectedOptions.length > 0) {
      selectedValue = selectedOptions[0].value || selectedOptions[0].text
    } else if (value && value.length > 0) {
      selectedValue = value[0]
    } else if (index !== undefined) {
      const columns = this.data.currentColumns
      if (columns && columns[index]) {
        if (typeof columns[index] === 'object') {
          selectedValue = columns[index].value || columns[index].text
        } else {
          selectedValue = columns[index]
        }
      }
    }
    
    console.log('Selected value:', selectedValue)
    
    if (pickerType === 'building') {
      this.setData({ building: selectedValue })
    } else if (pickerType === 'unit') {
      this.setData({ unit: selectedValue })
    } else if (pickerType === 'room') {
      this.setData({ room: selectedValue })
    } else if (pickerType === 'identity') {
      this.setData({ identity: selectedValue })
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
      identity,
      applicant_name: name,
      applicant_phone: phone,
      id_card_number: idCard
    }
    
    console.log('Request data:', requestData)
    console.log('Request data JSON:', JSON.stringify(requestData))

    wx.request({
      url: API_BASE_URL + '/property/house/binding/apply',
      method: 'POST',
      data: JSON.stringify(requestData),
      header: {
        'Authorization': 'Bearer ' + (wx.getStorageSync('token') || ''),
        'Content-Type': 'application/json'
      },
      success: (res) => {
        console.log('Response:', res)
        console.log('Response data:', res.data)
        console.log('Response message:', res.data?.message)
        console.log('Response errors:', res.data?.errors)
        
        if (res.statusCode === 200 && res.data.code === 200) {
          wx.showToast({
            title: '绑定成功',
            icon: 'success'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        } else {
          const errorMsg = res.data?.message || res.data?.data?.message || '绑定失败'
          const errors = res.data?.errors
          
          if (errors) {
            let errorDetails = ''
            for (const key in errors) {
              errorDetails += `${key}: ${errors[key].join(', ')}\n`
            }
            wx.showModal({
              title: '提交失败',
              content: errorMsg + '\n\n' + errorDetails,
              showCancel: false
            })
          } else {
            wx.showToast({
              title: errorMsg,
              icon: 'none'
            })
          }
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