# 🏗️ שלב 1: בניית סביבה
FROM node:20

# תיקיית העבודה הראשית בתוך הקונטיינר
WORKDIR /app

# העתקת קבצי התלויות
COPY package*.json ./

# התקנת כל התלויות
RUN npm install

# העתקת שאר הקבצים
COPY . .

# יצירת תיקיות קבועות אם לא קיימות
RUN mkdir -p uploads responses data

# פתיחת פורט השרת
EXPOSE 3000

# הפעלת האפליקציה
CMD ["node", "server.js"]
