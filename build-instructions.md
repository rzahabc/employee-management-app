# تعليمات بناء تطبيق مستقل - إدارة الموظفين

## الطريقة 1: استخدام EAS Build (الأفضل والأسهل)

### الخطوات:

1. تثبيت EAS CLI على جهازك:
```bash
npm install -g eas-cli
```

2. تسجيل الدخول (أو إنشاء حساب مجاني):
```bash
eas login
```

3. تحميل الملفات من Emergent إلى جهازك المحلي

4. بناء التطبيق:
```bash
cd frontend
eas build --platform android --profile preview
```

5. انتظر 10-15 دقيقة

6. ستحصل على رابط لتحميل ملف APK

7. حمّل APK وثبته على هاتفك

---

## الطريقة 2: Build محلي (متقدم)

يتطلب Android Studio و JDK:

```bash
cd frontend
npx expo prebuild
npx expo run:android
```

---

## معلومات التطبيق:

- **الاسم:** إدارة الموظفين
- **Package Name:** com.anonymous.employeemanagementapp
- **النسخة:** 1.0.0

## بيانات الدخول الافتراضية:

- **اسم المستخدم:** zahab
- **كلمة المرور:** 9999
- **الدور:** مدير النظام

---

## الدعم:

إذا واجهت مشاكل:
- Discord: https://discord.gg/VzKfwCXC4A
- Email: support@emergent.sh
