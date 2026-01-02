const API_BASE_URL = require('../../../config/api.js').API_BASE_URL

Page({
  data: {
    communityName: '智慧社区',
    parkingType: 'owned',
    parkingArea: '',
    parkingNo: '',
    identity: '',
    carNo: '',
    carBrand: '',
    carColor: '',
    ownerName: '',
    idCard: '',
    ownerPhone: '',
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

  onTypeChange(e) {
    this.setData({ parkingType: e.detail })
  },

  onCarNoChange(e) {
    console.log('CarNo change:', e.detail)
    const value = e.detail || e.detail.value || ''
    this.setData({ carNo: value })
  },

  validateCarNo(carNo) {
    const carNoPattern = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$/
    return carNoPattern.test(carNo)
  },

  onCarBrandChange(e) {
    console.log('CarBrand change:', e.detail)
    const value = e.detail || e.detail.value || ''
    this.setData({ carBrand: value })
  },

  onCarColorChange(e) {
    console.log('CarColor change:', e.detail)
    const value = e.detail || e.detail.value || ''
    this.setData({ carColor: value })
  },

  onOwnerNameChange(e) {
    console.log('OwnerName change:', e.detail)
    const value = e.detail || e.detail.value || ''
    this.setData({ ownerName: value })
  },

  onIdCardChange(e) {
    console.log('IdCard change:', e.detail)
    const value = e.detail || e.detail.value || ''
    this.setData({ idCard: value })
  },

  onOwnerPhoneChange(e) {
    console.log('OwnerPhone change:', e.detail)
    const value = e.detail || e.detail.value || ''
    this.setData({ ownerPhone: value })
  },

  showAreaPicker() {
    this.setData({
      showPicker: true,
      pickerTitle: '选择停车区域',
      pickerType: 'area',
      currentColumns: ['A区', 'B区', 'C区', 'D区']
    })
  },

  showParkingNoPicker() {
    if (!this.data.parkingArea) {
      wx.showToast({
        title: '请先选择停车区域',
        icon: 'none'
      })
      return
    }
    
    const parkingNos = []
    for (let i = 1; i <= 100; i++) {
      parkingNos.push(`${i}号`)
    }
    
    this.setData({
      showPicker: true,
      pickerTitle: '选择车位号',
      pickerType: 'parkingNo',
      currentColumns: parkingNos
    })
  },

  showIdentityPicker() {
    this.setData({
      showPicker: true,
      pickerTitle: '选择申请身份',
      pickerType: 'identity',
      currentColumns: [
        { text: '业主', value: 1 },
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
    
    if (pickerType === 'area') {
      this.setData({ parkingArea: selectedValue })
    } else if (pickerType === 'parkingNo') {
      this.setData({ parkingNo: selectedValue })
    } else if (pickerType === 'identity') {
      this.setData({ identity: selectedValue })
    }
    
    this.setData({ showPicker: false })
  },

  onSubmit() {
    const { parkingType, parkingArea, parkingNo, identity, carNo, carBrand, carColor, ownerName, idCard, ownerPhone } = this.data

    console.log('Form data:', { parkingType, parkingArea, parkingNo, identity, carNo, carBrand, carColor, ownerName, idCard, ownerPhone })

    if (!parkingArea || !parkingNo || !identity) {
      wx.showToast({
        title: '请填写车位信息',
        icon: 'none'
      })
      return
    }

    if (!carNo || !ownerName || !ownerPhone) {
      wx.showToast({
        title: '请填写车辆和车主信息',
        icon: 'none'
      })
      return
    }

    if (!this.validateCarNo(carNo)) {
      wx.showToast({
        title: '车牌号格式不正确，如：京A12345',
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
      parking_type: parkingType,
      parking_area: parkingArea,
      parking_no: parkingNo,
      identity,
      car_no: carNo,
      car_brand: carBrand,
      car_color: carColor,
      owner_name: ownerName,
      id_card: idCard,
      owner_phone: ownerPhone
    }
    
    console.log('Request data:', requestData)
    console.log('Request data JSON:', JSON.stringify(requestData))

    wx.request({
      url: API_BASE_URL + '/parking/binding/apply',
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