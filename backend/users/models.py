from django.contrib.auth.models import AbstractUser
from django.db import models

# Create your models here.
class User(AbstractUser):
    phone = models.CharField(max_length=15, unique=True, null=True, verbose_name="手机号")
    avatar = models.URLField(max_length=500, null=True, blank=True, verbose_name="头像")
    # 身份：0-普通居民, 1-物业人员, 2-商户
    role = models.SmallIntegerField(default=0, verbose_name="角色")

    class Meta:
        db_table = 'sys_user' # 自定义表名
