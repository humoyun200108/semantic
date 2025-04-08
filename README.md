# 🌐 Semantic AI – Open AI Web-Ilova

> Flask asosida ishlab chiqilgan, real serverda joylashtirilgan va to‘liq avtomatlashtirilgan AI mavzusidagi zamonaviy web-ilova.  
> 🧠 Ilovaning g‘oyasi, tuzilishi va deploy jarayoni muallif tomonidan mustaqil boshqarilgan.

## 🔗 Sayt manzili

👉 https://ai.oqdev.uz

## 🛠 Texnologiyalar

| Komponent       | Ishlatilgan texnologiya              |
|----------------|---------------------------------------|
| Backend         | Python (Flask)                       |
| Server          | Gunicorn + Supervisor                |
| Web server      | Nginx                                |
| Xosting         | Ubuntu 22.04 Virtual Machine (VM)    |
| Domen           | `ai.oqdev.uz` (DNS bilan bog‘langan) |
| HTTPS           | Certbot (Let's Encrypt)              |
| Avto-tiklanish  | Supervisor (restart, crash-handle)   |

## ⚙️ Loyiha imkoniyatlari

- Flask ilovasi orqali AI modelni chaqirish
- Gunicorn orqali stabil, barqaror WSGI server
- Nginx orqali tashqi dunyo bilan xavfsiz bog‘lanish
- HTTPS bilan to‘liq xavfsizlik (Chrome, Firefox, mobil brauzerlar uchun tayyor)
- Supervisor orqali server qayta yoqilganda avtomatik ishga tushish
- `.gitignore` bilan keraksiz fayllar tozalangan

## 🧠 Muallif haqida

Loyiha muallifi tomonidan mustaqil ravishda 0 dan ishlab chiqilgan:
- Fikrdan tortib, serverga joylashtirishgacha
- AI yordamida texnik bilimlarni mustaqil o‘zlashtirish asosida
- Haqiqiy muammolarni (NAT, DNS, SSL, port, firewall) hal qilish orqali real tajriba orttirilgan

## 🧾 Foydalanish

1. `git clone` yordamida loyihani yuklab oling
2. `venv` virtual muhit yarating
3. `requirements.txt` orqali kutubxonalarni o‘rnating
4. `gunicorn` yoki `flask run` orqali ishga tushiring

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
gunicorn --bind 0.0.0.0:8000 app:app
