# test.py faylining SODDALASHTIRILGAN versiyasi

print("--- 1: Skript boshlandi ---")

try:
    import os
    from groq import Groq, GroqError
    print("--- 2: Kutubxonalar import qilindi ---")
except ImportError as e:
    print(f"XATOLIK: Kutubxona import qilishda: {e}")
    exit()
except Exception as e:
    print(f"XATOLIK: Import paytida kutilmagan xato: {e}")
    exit()

# --- API Kalitini Sozlash ---
GROQ_API_KEY = None
try:
    # !!! BU YERGA JUDA EHTIYOTKORLIK BILAN O'ZINGIZNING 'gsk_...' KALITINGIZNI QO'YING !!!
    # Qo'shtirnoq ichida faqat kalitning o'zi bo'lsin, boshida yoki oxirida bo'sh joy qolmasin!
    GROQ_API_KEY = "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" # <<< FAQAT SHU QO'SHTIRNOQ ICHIGA!

    # Kalitdan ehtimoliy bosh/oxiridagi bo'shliqlarni olib tashlash
    GROQ_API_KEY = GROQ_API_KEY.strip()

    print(f"--- 3: API Kaliti o'rnatildi (tekshirilgan, birinchi 7 belgisi): {GROQ_API_KEY[:7]}... ---")

    if not GROQ_API_KEY.startswith("gsk_"):
         print("XATOLIK: Kiritilgan matn 'gsk_' bilan boshlanmayapti. API kalitni tekshiring.")
         exit()

except Exception as e:
    print(f"XATOLIK: API kalitini o'rnatishda: {e}")
    exit()
# -----------------------------

# --- Groq Klientini Yaratish ---
client = None
try:
    print("--- 4: Groq klientini yaratishga harakat...")
    client = Groq(api_key=GROQ_API_KEY)
    print("--- 5: Groq klienti yaratildi ---")
except GroqError as e:
    print(f"XATOLIK (API Error): Groq klienti yaratishda: {e}")
    # Bu yerda autentifikatsiya xatosi chiqishi mumkin, agar kalit noto'g'ri bo'lsa
    exit()
except Exception as e:
    print(f"XATOLIK (Umumiy): Groq klienti yaratishda: {e}")
    exit()
# -----------------------------

# --- Oddiy So'rov Yuborish ---
try:
    if client:
        print("--- 6: Groq API'ga so'rov yuborilmoqda...")
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": "1+1 nechchiga teng?"}],
            model="llama3-8b-8192",
            temperature=0.5,
            max_tokens=50,
        )
        print("--- 7: API javobi olindi ---")

        # Javobni chiqarish
        print("\n--- API JAVOBI ---")
        print(chat_completion.choices[0].message.content)
        print("--------------------")
        print("--- 8: So'rov muvaffaqiyatli bajarildi! ---")
    else:
        print("XATOLIK: Klient mavjud emasligi uchun so'rov yuborilmadi.")

except GroqError as e:
    print(f"XATOLIK (API Error): Groq API so'rovida: {e}")
    # Bu yerda ham autentifikatsiya/ruxsat xatosi chiqishi mumkin
except Exception as e:
    print(f"XATOLIK (Umumiy): So'rov yuborishda: {e}")
# -----------------------------

print("--- 9: Skript tugadi ---")