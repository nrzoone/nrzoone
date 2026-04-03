# 📑 NRZONE Factory PRO - Master Documentation

## 🚀 Quick Links

- **Live Application:** [https://nrzoone.vercel.app](https://nrzoone.vercel.app)
- **Source Code (GitHub):** [https://github.com/alishakhan12323q-blip/nrzone--factory](https://github.com/alishakhan12323q-blip/nrzone--factory)
- **Connected Google Sheet:** [Open Sheet](https://docs.google.com/spreadsheets/d/1wa_q_7FeeyeKxzZ4J1ZuiXO5NK-zGG-OVHHVn-FbXus/edit?usp=sharing)

## 🔐 System Credentials

- **Super Admin ID:** `NRZONE`
- **Super Admin Password:** `Irham@#`
- **Manager ID:** `MANAGER`
- **Manager Password:** `456`

---

## 📊 Google Sheet Sync Setup (How to Connect)

আপনার গুগল শিটে ডাটা অটোমেটিক পাঠানোর জন্য নিচের ধাপগুলো অনুসরণ করুন:

1. **গুগল শিট ওপেন করুন:** [এই লিংকে যান](https://docs.google.com/spreadsheets/d/1wa_q_7FeeyeKxzZ4J1ZuiXO5NK-zGG-OVHHVn-FbXus/edit?usp=sharing)।
2. **Apps Script এ যান:** উপরের মেনু থেকে `Extensions` > `Apps Script` সিলেক্ট করুন।
3. **কোড পেস্ট করুন:** ওখানে থাকা সব কোড মুছে নিচের কোডটি পেস্ট করুন:

```javascript
function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('SyncData') || ss.insertSheet('SyncData');

  // Header row if sheet is empty
  if (sheet.getLastRow() == 0) {
    sheet.appendRow(['Timestamp', 'Type', 'Worker', 'Detail', 'Amount']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#f3f3f3');
  }

  try {
    var data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      data.timestamp || new Date().toLocaleString(),
      data.type || 'N/A',
      data.worker || 'N/A',
      data.detail || 'N/A',
      data.amount || 0
    ]);
    return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
  } catch(err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}
```

1. **Deploy করুন:**
   - উপরে `Deploy` বাটনে ক্লিক করে `New Deployment` সিলেক্ট করুন।
   - `Select type` আইকনে ক্লিক করে `Web app` সিলেক্ট করুন।
   - **Description:** "NRZONE Sync" দিন।
   - **Execute as:** `Me` (আপনার ইমেইল থাকবে)।
   - **Who has access:** অবশ্যই `Anyone` সিলেক্ট করবেন (এটা না করলে অ্যাপ কানেক্ট হবে না)।
   - `Deploy` বাটনে ক্লিক করুন।
2. **URL কপি করুন:** ডেপ্লয় হওয়ার পর আপনি একটি **Web App URL** পাবেন। সেই ইউআরএলটি আমাকে দিলে আমি আপনার অ্যাপে সেট করে দেব।

---

## 🛠 Technical Environment

- **Framework:** React + Vite
- **Database:** Firebase Firestore
- **Styling:** Tailwind CSS + Vanilla CSS (Premium Theme)
- **Deployment:** Vercel (Auto-deploy enabled on git push)
