# استخدام صورة Node.js الرسمية
FROM node:18

# تحديد مجلد العمل داخل الحاوية
WORKDIR /app

# نسخ ملفات المشروع وتثبيت الحزم
COPY package*.json ./
RUN npm install
COPY . .

# تحديد البورت الذي يستخدمه التطبيق
EXPOSE 3000

# أمر التشغيل
CMD ["npm", "start"]
