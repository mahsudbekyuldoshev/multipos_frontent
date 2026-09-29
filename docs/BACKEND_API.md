2-QISM: Backend API spetsifikatsiyasi
Bu qismni yuqoridagi Gemini CLI prompti 
httpDriver.js
 izohiga ko'chiradi. Shuningdek, buni to'g'ridan-to'g'ri backend yozayotganingizda (yoki boshqa AI'ga backend yozdirayotganingizda) texnik topshiriq sifatida ham ishlatishingiz mumkin.
0. Muhim arxitektura qarori — avval shuni hal qiling
Hozirgi frontend kodida mahsulotlar (products) va sotuvlar (sales) umumiy, hech kimga bog'lanmagan holda saqlanadi — qaysi kassir so'ragan bo'lishidan qat'i nazar, bitta ro'yxat qaytadi. Lekin Super Admin panelida "Savdo Markazlari" (bir nechta filiallar) tushunchasi bor.
Agar real hayotda har bir kassir/markaz o'zining alohida ombori va sotuvlariga ega bo'lishi kerak bo'lsa (ehtimol shunday, chunki bu — obuna asosidagi ko'p-do'konli tizim), backend:
Product va Sale jadvaliga ownerId (yoki centerId) ustunini qo'shishi,
GET/POST/PUT/DELETE /products va GET/POST /sales so'rovlarida bu ID'ni so'rov tanasidan emas, balki Authorization token'dan (req.user.id) olishi kerak.
Agar aksincha — barcha kassirlar bitta umumiy ombordan foydalanishi kerak bo'lsa (bitta jismoniy do'kon, bir nechta kassa terminali), hech narsa qo'shish shart emas — hozirgi kontrakt shunga mos. Buni backend yozishni boshlashdan oldin hal qiling, chunki bu butun ma'lumotlar sxemasiga ta'sir qiladi.
Pastdagi spetsifikatsiya ikkala holat uchun ham ishlaydi — faqat scoping (ownerId bo'yicha filtrlash) backend ichida, token orqali, shaffof tarzda qo'shiladi.
1. Umumiy qoidalar
Base URL: frontend VITE_API_URL muhit o'zgaruvchisidan oladi (masalan https://api.multipos.uz yoki dev rejimida vite proxy orqali /api).
Formatlar: so'rov va javob — har doim Content-Type: application/json.
Autentifikatsiya: POST /auth/login va POST /contactdan tashqari BARCHA endpointlar Authorization: Bearer <token> sarlavhasini talab qiladi. Token bo'lmasa yoki noto'g'ri bo'lsa — 401 va { "message": "Avtorizatsiyadan o'ting." }.
Rollar: super_admin va kassir. /users* endpointlari faqat super_admin uchun — boshqa rol so'rasa 403 va { "message": "Sizda bu amal uchun ruxsat yo'q." }.
Xato formati (har doim bir xil bo'lishi shart):
json
  { "message": "Foydalanuvchiga ko'rsatiladigan aniq xato matni (o'zbek tilida)." }
Frontend bu messageni to'g'ridan-to'g'ri ekranga chiqaradi — texnik stack trace emas, odam o'qiydigan gap bo'lishi shart.
HTTP status kodlar: 200 (muvaffaqiyatli GET/PUT), 201 (yaratildi), 204 (o'chirildi, javob tanasisiz), 400 (validatsiya xatosi), 401 (token yo'q/yaroqsiz), 403 (ruxsat yo'q yoki obuna faol emas), 404 (topilmadi), 409 (takrorlanish, masalan SKU/telefon band), 500 (server xatosi).
Sana/vaqt formatlari:
createdAt maydonlari — to'liq ISO 8601 ("2026-09-22T14:30:00.000Z"), server tomonidan yaratiladi, client bermaydi.
receivedAt, subscriptionExpiresAt — faqat sana, "YYYY-MM-DD" formatida.
Pul: har doim butun son (so'm), kasrsiz. Miqdor (quantity, stock, minStock) — 2 xonagacha kasr bo'lishi mumkin (masalan 340.5).
Parol: hech qachon javobda qaytarilmaydi (na GET /users, na hech qayerda). Bazada hech qachon oddiy matn holida saqlanmaydi — bcrypt yoki argon2 bilan hash qilinadi.
2. Ma'lumotlar modeli
User
Maydon
Tur
Izoh
id
string
unikal
role
"super_admin" | "kassir"
fullName
string
phone
string, 9 ta raqam
O'zbekiston formati, +998 va bo'shliqlarsiz saqlanadi (masalan "901234567"). Unikal.
password
—
Faqat yaratish/yangilashda qabul qilinadi, javobda HECH QACHON qaytarilmaydi
centerName
string
Kassir qaysi savdo markaziga tegishli
subscriptionStatus
"active" | "inactive"
subscriptionExpiresAt
"YYYY-MM-DD"
createdAt
ISO datetime
Product
Maydon
Tur
Izoh
id
string
sku
string
Unikal (katta-kichik harfga sezgir emas)
name
string
category
"qurilish" | "elektrika" | "santexnika" | "avto"
unit
"dona" | "metr" | "kg" | "litr" | "quti" | "quop" | "rulon"
dona, quti, quop, rulon — faqat butun son; qolganlari kasr bo'lishi mumkin
price
number
so'm, butun son
stock
number
qoldiq
minStock
number
shundan kam bo'lsa "kam qoldi" hisoblanadi
receivedAt
"YYYY-MM-DD"
oxirgi kelgan sana
Sale
Maydon
Tur
Izoh
id
string
number
string

Chekdagi raqam, masalan "000123" — ketma-ket va TAKRORLANMAS bo'lishi shart (pastga qarang)
createdAt
ISO datetime
server yaratadi
total
number
barcha item'lar summasi
items
SaleItem[]
pastga qarang
SaleItem (Sale ichida, alohida jadval sifatida saqlash tavsiya etiladi)
Maydon
Tur
Izoh
productId
string
sku, name, category, unit, receivedAt
—
Sotuv PAYTIDAGI mahsulot holatining nusxasi (keyin mahsulot o'zgarsa/o'chsa ham chekda to'g'ri ma'lumot qolishi uchun)
unitPrice
number
sotuv paytidagi narx (hozirgi narx emas!)
quantity
number
lineTotal
number
round(unitPrice * quantity)
ContactMessage
Maydon
Tur
Izoh
id
string
name
string
phone
string
message
string
createdAt
ISO datetime
server yaratadi
3. Endpointlar
3.1 POST /auth/login — ochiq (token shart emas)
So'rov:
json
{ "phone": "901234567", "password": "1234" }
Muvaffaqiyat — 200:
json
{
  "token": "eyJhbGciOi...",
  "user": {
    "id": "u_kassir1",
    "role": "kassir",
    "fullName": "Ali Valiyev",
    "phone": "901234567",
    "centerName": "Mustahkam Savdo Markazi",
    "subscriptionStatus": "active",
    "subscriptionExpiresAt": "2027-09-22"
  }
}
Xatolar:
Telefon/parol noto'g'ri → 401, { "message": "Telefon raqam yoki parol noto'g'ri." }
MUHIM (biznes qoida): agar role === "kassir" va (subscriptionStatus === "inactive" YOKI subscriptionExpiresAt o'tgan bo'lsa) → 403 va mos xabar:
{ "message": "Obunangiz to'xtatilgan. Tizimdan foydalanish uchun administrator bilan bog'laning." }
{ "message": "Obuna muddati tugagan. Tizimdan foydalanishni davom ettirish uchun administrator bilan bog'laning." }
super_admin roli bu tekshiruvdan mustasno — u har doim kira oladi.
3.2 PUT /auth/profile — token shart (istalgan rol)
Maqsad: foydalanuvchi faqat o'zining profilini tahrirlaydi. id so'rov tanasida YUBORILMAYDI — backend uni tokendan (req.user.id) oladi.
So'rov:
json
{ "fullName": "Ali Valiyev", "phone": "901234567", "centerName": "...", "password": "yangiParol" }
password maydoni ixtiyoriy — bo'lmasa yoki bo'sh bo'lsa, parol o'zgartirilmaydi.
Muvaffaqiyat — 200: yangilangan user obyekti (login javobidagi bilan bir xil shaklda, parolsiz).
Xavfsizlik (MUHIM): backend so'rov tanasidan faqat fullName, phone, password, centerName maydonlarini qabul qilishi kerak. Agar so'rovda role, subscriptionStatus yoki subscriptionExpiresAt kabi maydonlar kelsa ham, ular e'tiborga olinmasligi shart (backend buni /users/:id bilan bir xil "update" funksiyasidan foydalansa ham, shu endpoint uchun ruxsat etilgan maydonlar ro'yxatini alohida cheklashi kerak). Aks holda oddiy kassir o'z "profilini yangilash" orqali o'zini super_admin qilib olishi yoki obunasini o'zi faollashtirib olishi mumkin bo'lib qoladi — bu imtiyozni oshirish (privilege escalation) zaifligi bo'ladi.
3.3 Foydalanuvchilar — faqat super_admin (token + rol tekshiruvi shart)
GET /users → 200, User[] (parolsiz).
POST /users — yangi kassir qo'shish. So'rov:
json
{
  "fullName": "Sardor Rustamov",
  "phone": "911112222",
  "password": "boshlangichParol",
  "centerName": "Filial nomi",
  "role": "kassir",
  "subscriptionStatus": "active",
  "subscriptionExpiresAt": "2027-09-22"
}
phone band bo'lsa → 409, { "message": "Ushbu telefon raqam bilan foydalanuvchi allaqachon mavjud." }
Muvaffaqiyat → 201, yaratilgan User (parolsiz).
PUT /users/:id — tahrirlash. So'rov POST /users bilan bir xil shaklda (parol bo'sh bo'lsa o'zgarmaydi). 404 agar topilmasa.
PUT /users/:id/subscription — faqat obunani boshqarish uchun qulay alohida endpoint. So'rov:
json
{ "status": "inactive", "expiresAt": "2027-09-22" }
→ 200, yangilangan User.
DELETE /users/:id → 204. Agar nishonlangan foydalanuvchi role === "super_admin" bo'lsa → 400, { "message": "Super adminni o'chirib bo'lmaydi." }.
3.4 Mahsulotlar — token shart (0-bandga qarang: scoping kerakmi yo'qmi hal qiling)
GET /products → 200, Product[].
POST /products So'rov: Product shaklidagi obyekt, idsiz.
sku band bo'lsa (katta-kichik harfga sezmasdan solishtirib) → 409, { "message": "«SKU» artikuli allaqachon mavjud." }
Muvaffaqiyat → 201, yaratilgan Product.

PUT /products/:id — xuddi shu validatsiya, 404 agar topilmasa.
DELETE /products/:id → 204.
3.5 Sotuvlar — token shart
GET /sales → 200, Sale[].
POST /sales — eng muhim va ehtiyot talab qiladigan endpoint.
So'rov (frontend faqat shuni yuboradi — narxni EMAS, faqat miqdorni):
json
{
  "items": [
    { "productId": "p9", "quantity": 4 },
    { "productId": "p1", "quantity": 3 }
  ]
}
Backend albatta bitta DB tranzaksiyasida quyidagilarni bajarishi shart:
items bo'sh bo'lmasligi kerak → aks holda 400, { "message": "Savat bo'sh." }.
Bir xil productId takrorlansa, miqdorlarini qo'shib hisoblash.
Har bir productId uchun mahsulotni bazadan topish; topilmasa → 400, { "message": "Savatdagi mahsulot omborda topilmadi." }.
quantity > 0 bo'lishi va joriy qoldiqdan oshmasligi kerak; oshsa → 400, { "message": "«Mahsulot nomi» uchun omborda yetarli qoldiq yo'q (qoldiq: X birlik)." }.
Har bir band uchun unitPrice = mahsulotning HOZIRGI narxi (bazadan olinadi, client'dan emas!), lineTotal = round(unitPrice * quantity).
Har bir mahsulotning stockini stock - quantity ga kamaytirish.
Chek raqamini (number) atomik tarzda generatsiya qilish — bazadagi sales sonini sanab (count + 1) EMAS, balki DB'ning avtomatik ketma-ket ustuni (auto-increment/sequence) yoki tranzaksiya ichidagi atomik counter orqali. Aks holda ikkita kassir bir vaqtda sotuv qilsa, bir xil chek raqami chiqishi yoki xatolik yuzaga kelishi mumkin.
total = barcha lineTotallarning yig'indisi.
Yaratilgan Saleni 201 bilan qaytarish.
Nega tranzaksiya shart: ikkita kassir bir vaqtning o'zida oxirgi 1 dona qolgan mahsulotni sotishga urinishi mumkin — tekshiruv (4-band) va kamaytirish (6-band) orasida boshqa so'rov kirib, ombordan ortiqcha sotib yuborilishining oldini olish uchun bazadagi qatorni qulflash (SELECT ... FOR UPDATE yoki ekvivalenti) yoki tranzaksion izolyatsiya darajasidan foydalanish tavsiya etiladi.
3.6 Aloqa formasi — ochiq (token shart emas)
POST /contact So'rov:
json
{ "name": "Jasur", "phone": "901234567", "message": "Narxlar haqida..." }
Bo'sh maydon bo'lsa → 400, mos xabar (masalan { "message": "Ismingizni kiriting." }).
Muvaffaqiyat → 201, { "id", "name", "phone", "message", "createdAt" }.
Backend bu yozuvni bazaga saqlashi (kim, qachon yozgani bilan) va xohlasa qo'shimcha bildirishnoma (Telegram/email) yuborishi mumkin — bu frontendga bog'liq emas.
4. Xavfsizlik talablari (qisqacha ro'yxat)
Parollar — bcrypt/argon2 bilan hash (hech qachon oddiy matn holida saqlanmasin).
JWT (yoki shunga o'xshash) token — muddati bilan (masalan 7 kun), maxfiy kalit .envda.
POST /auth/loginga rate-limit qo'yish tavsiya etiladi (masalan IP bo'yicha daqiqada 10 ta urinish) — parolni tasodifiy sinab ko'rishning oldini olish uchun.
CORS — faqat frontend domenidan so'rovlarga ruxsat berish (* emas, production'da).
Har bir himoyalangan endpoint tokenni tekshirishi va foydalanuvchi topilmasa/o'chirilgan bo'lsa 401 qaytarishi kerak.
5. Boshlang'ich (seed) ma'lumotlar
Frontend hozir demo rejimda quyidagi foydalanuvchilar bilan ishlaydi — backend bazasida ham xuddi shularni (parollarni hash qilib) yarating, aks holda mavjud demo login ma'lumotlari ishlamay qoladi:
Telefon
Parol
Rol
Ism
Markaz
991112233
admin
super_admin
Super Administrator
Boshqaruv Markazi
901234567
1234
kassir
Ali Valiyev
Mustahkam Savdo Markazi
Mahsulotlar uchun src/data/seedProducts.js faylidagi 20 ta yozuvni bazaga import qiling — bu fayl aynan qaysi maydonlar kerakligini (id bundan mustasno, backend o'zi generatsiya qiladi) to'liq ko'rsatadi.
6. Qabul qilish mezonlari (backend tayyor bo'lgach shularni sinang)
Frontend'da .env.local: VITE_USE_API=true, VITE_API_URL=<backend manzili> qo'ying.
Kassir sifatida login, mahsulot qidirish, savatga qo'shish, sotish — chek chiqishi va omborda qoldiq kamayishi kerak.
Super Admin sifatida login, yangi kassir qo'shish, obunani to'xtatish → o'sha kassir kira olmasligi (403 + aniq xabar) tekshirilishi kerak.

Ikki brauzer oynasida (yoki ikki qurilmada) bir vaqtda oxirgi qolgan 1 dona mahsulotni sotishga urinib ko'rish — faqat BITTASI muvaffaqiyatli bo'lishi, ombor manfiy bo'lib qolmasligi kerak.
"Xabar qoldirish" formasi orqali yuborilgan xabar bazada saqlanganini tekshirish.