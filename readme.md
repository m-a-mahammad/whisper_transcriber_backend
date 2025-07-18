<div align="center">

# 📘 whisper-transcriber-backend
</div>
<div dir="rtl">
نظام آلي لتحويل فيديوهات YouTube إلى ملفات تفريغ بصيغة `.srt` باستخدام Whisper، Google Colab، Google Drive API.</br>
يتم إنشاء Notebook تلقائيًا، رفعه على Drive، ثم تحميل ملفات التفريغ إلى جهازك.

---

## 🚀 المميزات

- 🔗 إدخال رابط YouTube من الطرفية
- 🧠 إنشاء Notebook تلقائي يحتوي على كود Whisper و yt-dlp
- ☁️ رفع الـNotebook إلى Google Drive
- 📥 تحميل ملفات `.srt` من Drive إلى سطح المكتب
- 🔐 مصادقة باستخدام Google Service Account

---

## 📦 المتطلبات

- Node.js 20+
- حساب Google Drive بخدمة Drive API مفعّلة

### 🔐 ملف `apikeys.json`
<div dir="ltr">

```json
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n",
  "client_email": "...@....gserviceaccount.com"
}
```
</div>

### 🧾 ملف `env.`
<div dir="ltr">

```json
env
INPUT_FOLDER_ID=your_input_folder_id
OUTPUT_FOLDER_ID=your_output_folder_id
```
</div>

---
### 🧰 تركيب المشروع

📦 أول خطوة هي تثبيت الحزم المطلوبة:
<div dir="ltr">

```bash
npm install
```
</div>

### 🧪 التشغيل
1️⃣ إنشاء ورفع الـ Notebook
<div dir="ltr">

```bash
npm run create-notebook
```
</div>

---
### 🎯 خطوات العملية:

<ul dir="rtl">
  <li>✅ سيطلب منك إدخال رابط YouTube</li>
  <li>📝 يتم إنشاء ملف whisper_transcriber.ipynb</li>
  <li>☁️ يُرفع الملف إلى Google Drive</li>
  <li>🔗 يُطبع رابط Colab و Drive في الطرفية</li>
</ul>

2️⃣ تحميل ملفات .srt من Drive
bash
npm run download-srt
📂 يتم البحث عن ملفات .srt في مجلد الإخراج

⬇️ يتم تحميلها إلى سطح المكتب تلقائيًا

---
### 🧠 كيف يعمل
| المرحلة           | الوصف                                                       |
|------------------|--------------------------------------------------------------|
| `authorize()`     | مصادقة باستخدام JWT من `apikeys.json`                        |
| `askYouTubeURL()` | إدخال رابط YouTube من المستخدم                               |
| `createNotebook()`| إنشاء ملف `ipynb.` يحتوي على كود Whisper و yt-dlp           |
| `uploadFile()`    | رفع الـ Notebook إلى Google Drive                             |
| `downloadSRT()`   | تحميل ملفات `srt.` من Drive إلى سطح المكتب

---
### 🛠️ إعداد TypeScript
تم ضبط `tsconfig.json` على أعلى مستوى من الدقة والوضوح:
<div dir="ltr">

```json
{
  "target": "ES2020",
  "module": "ESNext",
  "rootDir": "./src",
  "outDir": "./dist",
  "strict": true,
  "resolveJsonModule": true,
  "esModuleInterop": true
}
```
</div>

---
### 📁 هيكل المشروع المقترح
<div dir="ltr">
whisper-transcriber-backend/<br>
├── src/<br>
│   ├── createNotebook.ts<br>
│   ├── apikeys.json<br>
│   └── downloadSRT.ts<br>
├── .env<br>
├── tsconfig.json<br>
├── package.json<br>
└── README.md
</div>

---

### 📌 ملاحظات

<ul dir="rtl">
  <li>تأكد أن مجلدات `Drive (INPUT_FOLDER_ID, OUTPUT_FOLDER_ID)` تسمح بالوصول من حساب الخدمة.</li>
  <li>يمكنك تعديل الكود داخل الـ Notebook بما يناسب احتياجك (نموذج Whisper، تنسيق SRT، إلخ).</li>
  <li>`yt-dlp` يقوم بتنزيل الملفات الصوتية فقط لتسهيل وتسريع عملية التفريغ.</li>
</ul>

---
### ⚠️ ملاحظة مهمة  
> بسبب تحديثات الأخيرة في yt-dlp، قد تحتاج إلى ملفات تعريف الارتباط (Cookies) من حساب YouTube الخاص بك للوصول إلى بعض الفيديوهات المحمية أو الخاصة.  
> يُنصح باستخدام إضافة المتصفح [Cookie-Editor](https://cookie-editor.cgagnier.ca/) لاستخراج هذه البيانات:
>
> 1. قم بتثبيت الإضافة على متصفحك
> 2. افتح موقع YouTube وسجّل دخولك
> 3. افتح Cookie-Editor واضغط "Export"
> 4. احفظ المحتوى في ملف `cookies.txt` داخل مجلد المشروع
>
> بعدها سيتمكن yt-dlp من تحميل الفيديو باستخدام الأمر التالي داخل   الـ Notebook:
<div dir="ltr">

```bash
!yt-dlp --cookies /content/cookies.txt ...
```
</div>
