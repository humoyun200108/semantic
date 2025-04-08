# app.py faylining YAKUNIY TO'LIQ KODI
# Groq API (Llama 3), Statistika, Sentiment Tushuntirish, Bog'liqlik Grafigi, Ekspert Sahifa Route bilan

# Kerakli kutubxonalarni import qilish
from flask import Flask, request, render_template, jsonify
from groq import Groq, GroqError # Groq API kutubxonasi
import os
import json # JSON bilan ishlash uchun
import logging # Log yozish uchun
import time # Vaqt bilan ishlash uchun
import re # Regular expression (JSON tozalash va so'z sanash uchun)

# Flask ilovasini yaratish
app = Flask(__name__)
# Loglashni sozlash (terminalda nima bo'layotganini ko'rish uchun)
logging.basicConfig(level=logging.INFO)

# --- Groq API Kaliti va Klienti ---
client = None # Global o'zgaruvchi klient obyekti uchun
try:
    # !!! BU YERGA O'ZINGIZNING HAQIQIY 'gsk_...' GROQ API KALITINGIZNI KIRITING !!!
    GROQ_API_KEY = "YOUR GROQ API KEY" # <<< FAQAT SHU QO'SHTIRNOQ ICHIGA!
    GROQ_API_KEY = GROQ_API_KEY.strip() # Ortiqcha bo'shliqlarni olib tashlash

    # Kalit kiritilgan va to'g'ri formatda ekanligini tekshirish
    if not GROQ_API_KEY or not GROQ_API_KEY.startswith("gsk_"):
        logging.error("\n\n*** DIQQAT! Groq API kalitini app.py fayliga to'g'ri kiritmadingiz! ***\n\n")
        raise ValueError("Groq API Kaliti kiritilmagan yoki noto'g'ri formatda.")
    else:
        # Groq klientini yaratish
        client = Groq(api_key=GROQ_API_KEY)
        logging.info("Groq API kaliti tekshirildi va klient obyekti yaratildi.")

# Agar kalitni o'rnatishda xatolik bo'lsa
except ValueError as e:
     logging.error(e)
     # client = None qoladi
except GroqError as e:
    # API kaliti noto'g'ri bo'lsa, bu yerda ham xatolik chiqishi mumkin
    logging.error(f"Groq klientini yaratishda API xatosi: {e}")
    # client = None qoladi
except Exception as e:
    logging.error(f"API kalitini sozlashda kutilmagan xato: {e}")
    # client = None qoladi
# --------------------------------------------

# Groq'da ishlatiladigan model nomi
GROQ_MODEL = "llama3-8b-8192" # Llama 3 modelini ishlatamiz
logging.info(f"Ishlatilayotgan Groq modeli: {GROQ_MODEL}")

# --- JSON Ajratib Olish Uchun Yordamchi Funksiya ---
def extract_json_from_response(response_content):
    """
    Model javobidan JSON obyektini ajratib olishga harakat qiladi.
    Avval ```json ... ``` blokini, keyin { ... } blokini qidiradi.
    """
    logging.debug(f"JSON ajratish uchun xom javob (qisqa):\n{response_content[:500]}...")

    # 1-urinish: ```json ... ``` blokini regex bilan topish
    match = re.search(r"```json\s*(\{.*?\})\s*```", response_content, re.DOTALL | re.IGNORECASE)
    if match:
        json_string = match.group(1)
        logging.info("JSON ```json``` belgilari orasidan topildi.")
        try:
            # Ajratib olingan stringni parse qilish
            return json.loads(json_string.strip())
        except json.JSONDecodeError as e:
            logging.error(f"```json``` ichidagi matnni parse qilishda xato: {e}")
            raise ValueError(f"Model ```json``` bloki ichida noto'g'ri format qaytardi.") from e

    # 2-urinish: Birinchi '{' va oxirgi '}' orasini topish
    logging.info("```json``` topilmadi, '{' va '}' qidirilmoqda...")
    json_start_index = response_content.find('{')
    json_end_index = response_content.rfind('}')

    if json_start_index != -1 and json_end_index != -1 and json_end_index > json_start_index:
        # '{' dan oxirgi '}' gacha bo'lgan qismni ajratib olish
        json_string_cleaned = response_content[json_start_index:json_end_index+1]
        logging.info(f"Birinchi '{{' va oxirgi '}}' orasidagi qism (qisqa):\n{json_string_cleaned[:200]}...")
        try:
            # Aynan shu qismni parse qilishga urinish
            parsed_json = json.loads(json_string_cleaned.strip())
            logging.info("JSON '{...}' orasidan muvaffaqiyatli parse qilindi.")
            return parsed_json
        except json.JSONDecodeError as e:
            # Agar bu qism ham yaroqli JSON bo'lmasa
            logging.error(f"'{...}' orasidagi parse xatosi: {e}")
            raise ValueError("Model javobida topilgan '{...}' bloki yaroqli JSON emas.") from e
    else:
        # Agar '{' yoki '}' umuman topilmasa
        logging.error("Xom javobda JSON obyektining boshlanishi ('{') yoki tugashi ('}') topilmadi.")
        raise ValueError("Model javobida JSON obyekt topilmadi.")

# --- Asosiy Route'lar ---

# Bosh sahifa uchun
@app.route('/')
def index():
    """Asosiy HTML sahifani (index.html) ko'rsatadi."""
    return render_template('index.html')

# Asosiy tahlil uchun
@app.route('/analyze', methods=['POST'])
def analyze_text():
    """Frontenddan matnni qabul qilib, Groq API orqali tahlil qiladi va JSON natijani qaytaradi."""
    global client # Global klient o'zgaruvchisidan foydalanish
    if not client:
         logging.error("Xatolik: Groq klienti mavjud emas (/analyze).")
         return jsonify({"error": "Serverda API sozlamalarida xatolik bor."}), 500

    try:
        # Frontenddan JSON ma'lumotni olish
        data = request.get_json()
        # Ma'lumot va 'text' kaliti mavjudligini tekshirish
        if not data or 'text' not in data:
             logging.warning("Frontenddan 'text' maydoni bilan JSON kelmadi.")
             return jsonify({"error": "Noto'g'ri so'rov formati."}), 400

        text_to_analyze = data.get('text', '').strip()
        # Matn bo'sh emasligini tekshirish
        if not text_to_analyze:
            logging.warning("Bo'sh matn yuborildi.")
            return jsonify({"error": "Tahlil uchun matn yuborilmadi."}), 400

        # Matn uzunligini cheklash
        MAX_TEXT_LENGTH = 4000 # Belgilar soni
        original_length = len(text_to_analyze) # Statistikalar uchun asl uzunlik
        if original_length > MAX_TEXT_LENGTH:
            text_to_analyze = text_to_analyze[:MAX_TEXT_LENGTH]
            logging.warning(f"Matn hajmi {MAX_TEXT_LENGTH} belgiga chegaralandi.")

        logging.info(f"\nGroq API uchun tahlilga matn: '{text_to_analyze[:100]}...'")

        # Asosiy tahlil uchun prompt (Yangi NER turlari bilan)
        analysis_prompt = """TASK: O'zbek tilidagi quyidagi matnni semantik tahlil qil va natijani JSON formatida qaytar.
ANALYSIS TASKS:
1. entities: Matndagi nomlangan obyektlarni va muhim tushunchalarni top (PERSON, LOCATION, ORGANIZATION, SOHA, TUSHUNCHA). Umumiy sohalarni (tibbiyot, ta'lim) SOHA, umumiy tushunchalarni (sun'iy intellekt) TUSHUNCHA deb belgilashga harakat qil. LOCATION/ORGANIZATION deb xato belgilama. Topa olmasang []. Har bir obyekt uchun "text" va "type" maydonlari bo'lsin.
2. sentiment: Matnning umumiy hissiyotini aniqla (POSITIVE, NEGATIVE, NEUTRAL). Faqat shu uch qiymatdan birini qaytar.
3. keywords: Asosiy kalit so'zlarni (maksimum 10 ta) ajratib ol ([]). Topa olmasang bo'sh ro'yxat qaytar.
OUTPUT FORMAT: Javobni faqat va faqat quyidagi JSON strukturasida, boshqa hech qanday matnsiz, izohsiz qaytar:
```json
{{
  "entities": [ {{"text": "...", "type": "..."}}, ... ],
  "sentiment": "...",
  "keywords": ["...", "..."]
}}
```
TEXT TO ANALYZE:
""" + text_to_analyze

        # Groq API ga so'rov yuborish
        try:
            logging.info(f"Groq API ({GROQ_MODEL}) ga tahlil so'rovi yuborilmoqda...")
            start_time = time.time()
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": analysis_prompt}],
                model=GROQ_MODEL,
                temperature=0.2, # Aniqroq natija uchun
                max_tokens=1024, # Javob uchun yetarli joy
            )
            end_time = time.time()
            logging.info(f"Groq API tahlil javobi {end_time - start_time:.2f} soniyada olindi.")
            api_response_content = chat_completion.choices[0].message.content
            logging.info(f"Groq API (tahlil) xom javobi:\n{api_response_content}")

            # API javobidan JSON qismini ajratib olish (yordamchi funksiya bilan)
            try:
                analysis_result = extract_json_from_response(api_response_content)

                # --- STATISTIKANI HISOBLASH ---
                char_count = original_length # Haqiqiy belgi soni
                # So'zlarni sanash (punktuatsiyani hisobga olmaydi)
                word_count = len(re.findall(r'\b\w+\b', text_to_analyze))
                # Gaplarni sanash (taxminiy)
                sentence_count = text_to_analyze.count('.') + text_to_analyze.count('!') + text_to_analyze.count('?')
                # Agar tinish belgisi bo'lmasa ham, kamida 1 gap deb hisoblash
                if sentence_count == 0 and char_count > 0: sentence_count = 1

                # Obyekt turlarini sanash
                entity_counts = {"PERSON": 0, "LOCATION": 0, "ORGANIZATION": 0, "SOHA": 0, "TUSHUNCHA": 0, "UNKNOWN": 0}
                allowed_types = set(entity_counts.keys())
                valid_entities = []
                # Model qaytargan entitylarni tekshirish va sanash
                if 'entities' in analysis_result and isinstance(analysis_result['entities'], list):
                    for e in analysis_result['entities']:
                       if isinstance(e, dict) and e.get('type') in allowed_types:
                           entity_counts[e['type']] += 1
                           valid_entities.append(e)
                       elif isinstance(e, dict): # Agar type noma'lum bo'lsa
                            entity_counts["UNKNOWN"] += 1
                            # valid_entities.append(e) # Noma'lumlarni qo'shmaslik mumkin
                analysis_result['entities'] = valid_entities # Faqat to'g'ri turlarni qoldiramiz

                # Keywords formatini tekshirish
                if 'keywords' not in analysis_result or not isinstance(analysis_result['keywords'], list):
                    analysis_result['keywords'] = []
                keyword_count = len(analysis_result['keywords'])

                # Sentiment formatini tekshirish
                allowed_sentiments = {"POSITIVE", "NEGATIVE", "NEUTRAL"}
                if 'sentiment' not in analysis_result or analysis_result.get('sentiment') not in allowed_sentiments:
                     analysis_result['sentiment'] = "NEUTRAL" # Agar xato kelsa, NEUTRAL deb belgilash

                # Statistikani asosiy natija obyektiga qo'shish
                analysis_result['stats'] = {
                    'char_count': char_count,
                    'word_count': word_count,
                    'sentence_count': sentence_count,
                    'entity_counts': {k: v for k, v in entity_counts.items() if v > 0}, # Faqat 0 dan katta bo'lganlarni qo'shamiz
                    'keyword_count': keyword_count
                }
                # --- STATISTIKA TUGADI ---

                logging.info("Tahlil javobi JSON'ga o'girildi va statistika qo'shildi.")
                return jsonify(analysis_result) # Yakuniy JSON natijani frontendga qaytarish

            except (json.JSONDecodeError, ValueError) as json_e:
                # Agar JSON'ga o'girishda yoki extract_json_from_response da xatolik bo'lsa
                logging.error(f"Tahlil javobini JSON'ga o'girishda xatolik: {json_e}")
                return jsonify({"error": "Tahlil natijasini server tushuna olmadi."}), 500

        # Groq API bilan bog'liq xatoliklarni ushlash
        except GroqError as e:
             logging.error(f"Groq API (tahlil) so'rovida xatolik: {e}")
             error_message = f"API bilan bog'lanishda xatolik yuz berdi."
             status_code = getattr(e, 'status_code', 503) # Status kodini olishga urinish
             if status_code == 429: error_message = "API so'rovlar limiti tugadi. Iltimos, birozdan so'ng qayta urinib ko'ring."
             elif status_code in [401, 403]: error_message = "API kaliti noto'g'ri yoki ushbu amalga ruxsat yo'q."
             elif status_code == 400: error_message = f"API ga noto'g'ri so'rov yuborildi (model '{GROQ_MODEL}'?)."
             else: error_message = f"API xatosi (Kod: {status_code})."
             return jsonify({"error": error_message}), status_code
        except Exception as e:
            # Boshqa kutilmagan xatoliklar
            logging.error(f"Tahlil API chaqiruvida noma'lum xatolik: {e}")
            return jsonify({"error": "Tahlil jarayonida noma'lum server xatoligi."}), 500

    # Umumiy xatoliklar (masalan, request.get_json() da)
    except Exception as e:
        logging.error(f"'/analyze' funksiyasida umumiy xatolik: {e}")
        return jsonify({"error": "Serverda noma'lum ichki xatolik."}), 500


# --- Sentimentni Tushuntirish Uchun Route ---
@app.route('/explain_sentiment', methods=['POST'])
def explain_sentiment_route():
    """Frontenddan matn va sentimentni qabul qilib, Groq API'dan tushuntirish so'raydi."""
    global client # Global klientdan foydalanish
    if not client: return jsonify({"error": "Serverda API sozlamalarida xatolik bor."}), 500
    try:
        data = request.get_json(); text = data.get('text','').strip(); sentiment = data.get('sentiment','').strip()
        # Kiritilgan ma'lumotlarni tekshirish
        if not text or sentiment not in {"POSITIVE", "NEGATIVE", "NEUTRAL"}:
            logging.warning("Tushuntirish uchun noto'g'ri ma'lumot keldi.")
            return jsonify({"error": "Noto'g'ri ma'lumot yuborildi."}), 400

        logging.info(f"\nSentimentni ({sentiment}) tushuntirish uchun matn: '{text[:100]}...'")
        # Tushuntirish uchun maxsus prompt
        prompt = f"""TASK: Quyidagi matnning hissiyoti "{sentiment}" deb topilgan. Nima uchun aynan shunday baholanganini o'zbek tilida, 2-3 gap bilan qisqa va tushunarli qilib izohlab ber. Matndagi qaysi so'zlar yoki iboralar bunga eng ko'p ta'sir qilganini misol keltir. Javobni faqat izoh matni sifatida, boshqa hech narsa qo'shmasdan qaytar.\n\nMATN:\n"{text}"\n\nSENTIMENT: {sentiment}\n\nIZOH (O'zbek tilida, qisqa):"""
        try:
            logging.info(f"Groq API ({GROQ_MODEL}) ga tushuntirish so'rovi yuborilmoqda...")
            start_time = time.time()
            # API ga so'rov yuborish
            completion = client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=GROQ_MODEL,
                temperature=0.5, # Tushuntirish uchun biroz erkinlik
                max_tokens=300 # Qisqa javob uchun
            )
            end_time = time.time()
            logging.info(f"Groq API tushuntirish javobi {end_time - start_time:.2f} soniyada olindi.")

            explanation = completion.choices[0].message.content
            logging.info(f"Groq API tushuntirish javobi:\n{explanation}")
            # Tushuntirish matnini JSON formatida qaytarish
            return jsonify({"explanation": explanation.strip()})

        # API xatoliklari
        except GroqError as e:
            logging.error(f"Groq API (tushuntirish) so'rovida xatolik: {e}")
            status_code = getattr(e, 'status_code', 503)
            msg = "Tushuntirish olishda API xatosi."
            if status_code == 429: msg = "API so'rovlar limiti tugadi."
            return jsonify({"error": msg}), status_code
        except Exception as e:
            # Boshqa kutilmagan xatoliklar
            logging.error(f"Tushuntirish API chaqiruvida noma'lum xatolik: {e}")
            return jsonify({"error": "Tushuntirish olishda noma'lum server xatoligi."}), 500
    except Exception as e:
        # Umumiy xatoliklar
        logging.error(f"'/explain_sentiment' funksiyasida umumiy xatolik: {e}")
        return jsonify({"error": "Serverda ichki xatolik (tushuntirish)."}), 500
# --- Sentimentni Tushuntirish Route Tugadi ---


# --- Obyektlar Bog'liqligini Olish Uchun Route ---
@app.route('/get_relationships', methods=['POST'])
def get_relationships_route():
    """Matndan obyektlar va ular orasidagi bog'liqliklarni topishga harakat qiladi."""
    global client
    if not client:
        return jsonify({"error": "Serverda API sozlamalarida xatolik bor."}), 500

    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "Bog'liqlikni topish uchun matn yuborilmadi."}), 400

        text_to_analyze = data.get('text', '').strip()
        if not text_to_analyze:
            return jsonify({"error": "Bo'sh matn yuborildi."}), 400

        MAX_REL_TEXT_LENGTH = 2000 # Cheklangan matn uzunligi
        if len(text_to_analyze) > MAX_REL_TEXT_LENGTH:
            text_to_analyze = text_to_analyze[:MAX_REL_TEXT_LENGTH]
            logging.warning("Bog'liqlik topish uchun matn hajmi chegaralandi.")

        logging.info(f"\nGroq API uchun bog'liqlik qidirishga matn: '{text_to_analyze[:100]}...'")

        # Bog'liqliklarni topish uchun prompt
        relationship_prompt = f"""TASK: O'zbek tilidagi quyidagi matnni tahlil qilib, undagi asosiy nomlangan obyektlar (PERSON, LOCATION, ORGANIZATION, SOHA, TUSHUNCHA) va ular orasidagi mantiqiy bog'liqliklarni aniqla.
INSTRUCTIONS:
1. Avval matndagi asosiy obyektlarni aniqla (text, type). Obyekt matni ('text') noyob bo'lishi kerak. Agar bir xil matnli obyektlar bo'lsa, ularni bitta deb hisobla.
2. Keyin shu obyektlar orasidagi aniq bog'liqliklarni (links/relationships) top ('source' obyekt matni, 'target' obyekt matni, 'relation' bog'liqlik turi). 'source' va 'target' qiymatlari aniqlangan obyektlarning 'text' qiymatlariga mos kelishi kerak.
3. Faqat matnda aniq ko'rsatilgan yoki kuchli mantiqiy bog'liqliklarni top. Agar bog'liqlik topilmasa, bo'sh "links" massivini qaytar.
4. Natijani quyidagi JSON formatida, boshqa hech qanday matnsiz qaytar:
OUTPUT FORMAT:
```json
{{
  "nodes": [ {{"id": "Unikal Obyekt Matni 1", "label": "Obyekt Matni 1", "group": "ENTITY_TYPE_1"}}, ... ],
  "links": [ {{"from": "Unikal Obyekt Matni 1", "to": "Unikal Obyekt Matni 2", "label": "bog'liqlik turi 1"}}, ... ]
}}
```
("group" maydoni obyekt turiga mos bo'lsin: PERSON, LOCATION, ORGANIZATION, SOHA, TUSHUNCHA. "id" va "label" odatda bir xil bo'ladi, lekin "id" noyob bo'lishi kerak.)
TEXT TO ANALYZE:
"{text_to_analyze}"
"""
        try:
            logging.info(f"Groq API ({GROQ_MODEL}) ga bog'liqlik so'rovi...")
            start_time = time.time()
            # API chaqiruvi
            chat_completion = client.chat.completions.create(messages=[{"role": "user", "content": relationship_prompt}], model=GROQ_MODEL, temperature=0.1, max_tokens=2048)
            end_time = time.time(); logging.info(f"Groq API bog'liqlik javobi {end_time - start_time:.2f}s olindi.")
            api_response_content = chat_completion.choices[0].message.content; logging.info(f"Groq API (bog'liqlik) xom javobi:\n{api_response_content}")
            # JSON ajratib olish (yordamchi funksiya bilan)
            try:
                relationship_data = extract_json_from_response(api_response_content)
                # Javob formatini tekshirish
                if 'nodes' in relationship_data and 'links' in relationship_data and isinstance(relationship_data['nodes'], list) and isinstance(relationship_data['links'], list):
                     logging.info("Bog'liqlik javobi muvaffaqiyatli JSON'ga o'girildi.")
                     return jsonify(relationship_data) # Frontendga yuborish
                else: raise json.JSONDecodeError("Required keys/types missing in JSON", json.dumps(relationship_data), 0)
            except (json.JSONDecodeError, ValueError) as json_e: logging.error(f"... Bog'liqlik JSON parse xatosi: {json_e}"); return jsonify({"error": "Bog'liqlik natijasini server tushuna olmadi."}), 500
        except GroqError as e: logging.error(f"... Groq API bog'liqlik xatosi: {e}"); status_code = getattr(e, 'status_code', 503); return jsonify({"error": f"Bog'liqlik olishda API xatosi (Kod: {status_code})."}), status_code
        except Exception as e: logging.error(f"... Bog'liqlik API chaqiruvida noma'lum xato: {e}"); return jsonify({"error": "Bog'liqlik olishda noma'lum server xatoligi."}), 500
    except Exception as e: logging.error(f"'/get_relationships' xatosi: {e}"); return jsonify({"error": "Ichki server xatoligi (bog'liqlik)."}), 500
# --- BOG'LIQLIK ROUTE TUGADI ---


# --- Sentiment Dinamikasini Olish Uchun Route ---
@app.route('/get_sentiment_dynamics', methods=['POST'])
def get_sentiment_dynamics_route():
    """Matnni gaplarga bo'lib, har birining sentimentini aniqlaydi."""
    global client
    if not client:
        return jsonify({"error": "Serverda API sozlamalarida xatolik bor."}), 500

    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "Sentiment dinamikasi uchun matn yuborilmadi."}), 400

        text_to_analyze = data.get('text', '').strip()
        if not text_to_analyze:
            return jsonify({"error": "Bo'sh matn yuborildi."}), 400

        MAX_DYN_TEXT_LENGTH = 4000
        if len(text_to_analyze) > MAX_DYN_TEXT_LENGTH:
            text_to_analyze = text_to_analyze[:MAX_DYN_TEXT_LENGTH]
            logging.warning("Sentiment dinamikasi uchun matn hajmi chegaralandi.")

        logging.info(f"\nGroq API uchun sentiment dinamikasi matni: '{text_to_analyze[:100]}...'")

        # Sentiment dinamikasi uchun maxsus prompt
        dynamics_prompt = f"""TASK: Quyidagi matnni gaplarga ajrat va har bir gapning hissiyotini (sentiment) alohida aniqla (POSITIVE, NEGATIVE, yoki NEUTRAL).
INSTRUCTIONS:
1. Matnni tabiiy gaplarga bo'l (nuqta, so'roq, undov belgilariga qarab). Har bir gapni alohida tahlil qil.
2. Har bir gap uchun sentimentni (POSITIVE, NEGATIVE, NEUTRAL) aniqla.
3. Natijani faqat JSON formatida, "sentence_sentiments" kaliti ostida massiv (list) ko'rinishida qaytar. Massivdagi har bir element bitta gapning sentimentini bildirsin (matndagi tartibda). Boshqa hech qanday matn yoki izoh qo'shma.

OUTPUT FORMAT:
```json
{{
  "sentence_sentiments": ["SENTIMENT_1", "SENTIMENT_2", "SENTIMENT_3", ...]
}}
```
(Masalan: {{"sentence_sentiments": ["POSITIVE", "NEUTRAL", "NEGATIVE"]}})

TEXT TO ANALYZE:
"{text_to_analyze}"
"""

        try:
            logging.info(f"Groq API ({GROQ_MODEL}) ga sentiment dinamikasi so'rovi...")
            start_time = time.time()
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": dynamics_prompt}],
                model=GROQ_MODEL,
                temperature=0.1, # Aniqroq klassifikatsiya uchun
                max_tokens=1024 # Yetarlicha joy
            )
            end_time = time.time()
            logging.info(f"Groq API sentiment dinamikasi javobi {end_time - start_time:.2f} soniyada olindi.")

            api_response_content = chat_completion.choices[0].message.content
            logging.info(f"Groq API (dinamika) xom javobi:\n{api_response_content}")

            # JSON ajratib olish (yordamchi funksiya bilan)
            try:
                dynamics_data = extract_json_from_response(api_response_content)
                # Javobda kerakli kalit va format borligini tekshirish
                if 'sentence_sentiments' in dynamics_data and isinstance(dynamics_data['sentence_sentiments'], list):
                    # Faqat ruxsat etilgan qiymatlarni qoldirish (qo'shimcha himoya)
                    allowed = {"POSITIVE", "NEGATIVE", "NEUTRAL"}
                    dynamics_data['sentence_sentiments'] = [s for s in dynamics_data['sentence_sentiments'] if isinstance(s, str) and s in allowed]
                    logging.info("Sentiment dinamikasi javobi muvaffaqiyatli JSON'ga o'girildi.")
                    return jsonify(dynamics_data)
                else:
                    logging.error("Dinamika javobida 'sentence_sentiments' massivi topilmadi yoki turi noto'g'ri.")
                    raise json.JSONDecodeError("Required key/type missing", json.dumps(dynamics_data),0)

            except (json.JSONDecodeError, ValueError) as json_e:
                logging.error(f"Dinamika javobini JSON'ga o'girishda xatolik: {json_e}")
                return jsonify({"error": "Sentiment dinamikasi natijasini server tushuna olmadi."}), 500

        # API xatoliklari
        except GroqError as e:
            logging.error(f"Groq API (dinamika) so'rovida xatolik: {e}")
            status_code = getattr(e, 'status_code', 503)
            return jsonify({"error": f"Sentiment dinamikasini olishda API xatosi (Kod: {status_code})."}), status_code
        except Exception as e:
            logging.error(f"Dinamika API chaqiruvida noma'lum xatolik: {e}")
            return jsonify({"error": "Sentiment dinamikasini olishda noma'lum server xatoligi."}), 500

    except Exception as e:
        logging.error(f"'/get_sentiment_dynamics' funksiyasida umumiy xatolik: {e}")
        return jsonify({"error": "Serverda noma'lum ichki xatolik (dinamika)."}), 500
# --- SENTIMENT DINAMIKASI ROUTE TUGADI ---


# --- Natijalar Sahifasi Uchun Route ---
@app.route('/results')
def show_results():
    logging.info("Oddiy natijalar sahifasi so'raldi (/results).")
    return render_template('results.html')

# --- Ekspert Tahlil Sahifasi Uchun Route ---
@app.route('/expert_results')
def show_expert_results():
    logging.info("Ekspert tahlil sahifasi so'raldi (/expert_results).")
    return render_template('expert_results.html')

# Serverni ishga tushirish
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

