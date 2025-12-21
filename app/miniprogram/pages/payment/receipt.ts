// pages/payment/receipt.ts

interface ReceiptInfo {
  bill_info: {
    bill_no: string;
    title: string;
    fee_type_display: string;
    amount: string;
    paid_amount: string;
    payment_method_display: string;
    payment_reference: string;
    paid_at: string;
    period: string;
  };
  payer_info: {
    name: string;
    phone: string;
  };
  property_info: {
    address: string;
    area: string;
    unit_price: string;
    quantity: string;
  };
  receipt_info: {
    receipt_no: string;
    generated_at: string;
    status: string;
    seal_text: string;
  };
}

Page({
  data: {
    receiptList: [] as ReceiptInfo[],
    loading: false,
    billIds: '' as string
  },

  onLoad(options: any) {
    const billIds = options.billIds || '';
    this.setData({ billIds });
    this.loadReceipts();
  },

  async loadReceipts() {
    const { billIds } = this.data;
    if (!billIds) {
      wx.showToast({ title: '参数错误', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    const billIdList = billIds.split(',');
    const receiptList: ReceiptInfo[] = [];

    // 逐个获取每张账单的电子凭证
    let processedCount = 0;
    const totalBills = billIdList.length;
    
    for (const billId of billIdList) {
      wx.request({
        url: `http://localhost:8000/api/property/bills/${billId}/receipt`,
        method: 'GET',
        success: (res: any) => {
          if (res.statusCode === 200 && res.data && res.data.code === 200) {
            receiptList.push(res.data.data);
          } else {
            const errorMsg = (res.data && res.data.message) || '获取凭证失败';
            console.error(`获取账单${billId}凭证失败:`, errorMsg);
          }
        },
        fail: (error) => {
          console.error(`获取账单${billId}凭证异常:`, error);
        },
        complete: () => {
          processedCount++;
          
          // 所有请求完成后更新数据
          if (processedCount === totalBills) {
            this.setData({ receiptList, loading: false });

            if (receiptList.length === 0) {
              wx.showToast({ title: '获取凭证失败', icon: 'none' });
            }
          }
        }
      });
    }
  },

  // 保存凭证到相册
  async saveReceipt(event: any) {
    const index = event.currentTarget.dataset.index;
    const receipt = this.data.receiptList[index];
    
    if (!receipt) return;

    try {
      // 这里可以实现将凭证信息生成图片并保存到相册
      // 由于微信小程序Canvas API较复杂，这里先用截图功能
      wx.showModal({
        title: '保存凭证',
        content: '请截图保存缴费凭证，或联系物业获取纸质凭证',
        showCancel: false
      });
    } catch (error) {
      console.error('保存凭证失败:', error);
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
  },

  // 分享凭证
  onShareAppMessage(options: any) {
    const receipt = this.data.receiptList[0];
    
    return {
      title: `缴费凭证 - ${receipt?.bill_info.title || '物业缴费'}`,
      path: `/pages/payment/receipt?billIds=${this.data.billIds}`,
      imageUrl: '' // 可以生成凭证的缩略图
    };
  },

  onGoBack() {
    wx.navigateBack();
  }
});
