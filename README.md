# project

Kész
----------------------------------------------------
1. Rendszerkövetelmény-specifikáció (URS / SRS)
- Üzleti és felhasználói igények részletes leírása
- Funkcionális és nem funkcionális követelmények


Folyamatban
--------------------------------------------------

2. Projektterv
- Ütemezés, mérföldkövek, erőforrások, szerepkörök
- Kockázatkezelési terv, költségbecslés
- support system
- űzenőfal, message system
- account, felhasználói fiók rendszer, admin
- beállítások menüpont
- keresőmotor
- nyelvválasztási lehetőség   



3. Rendszerarchitektúra-leírás
- A rendszer komponensei, moduljai, interfészek közti kapcsolatok
- Architektúra diagramok (pl. rétegmodell, komponensdiagram)

Frontend Modul:
- Javascript, JSON
- játéklista megjelenítése
- játék adatlapok
- keresés, szűrés, rendezés
- API hívások a backend felé (HTTP/REST vagy GraphQL)

Backend modul:
- játék adatainak lekérése, hozzáadása, módosítása
- keresési logika 
- műfajok és kategóriák kezelése
- konzolok, PC és egyéb platformok listája, kapcsolatai a játékokkal
- kezelheti a regisztrációt, bejelentkezést, kedvencek listáját
- Node.js + Express


Adatbázis réteg: 
- adatok tárolása relációs adatbázisban (MySQL, vagy PostgreSQL)
- saját táblák felhasználókhoz, üzenőfalhoz, GOTY-hoz, hírekhez

Külső szolgáltatások:
- kép/CDN tárolás
- auth login (Google, Discord, Steam)
- analytics (oldallátogatások, népszerű játkékok)

Infrastruktúra réteg:
- webszerver (Apache)
- backend futtató környezet (Node.js, PHP)
- DB szerver vagy fehős adatbázis


Játéklista lekérése:
1. felhasználó belép az oldalra
2. frontend meghívja: GET/api/games
Backend:
    - ellenőrzi a paramétereket (keresés/szűrés)
    - adatbázisból lekéri a játékokat
4. backend visszaküldi JSON formátumban
5. frontend megjeleníti a listát


Biztonság és jogosultságkezelés:
- HTTPS kommunikáció
- API kulcs vagy JWT token (ha van login)
- admin jogosultság a játékok hozzáadásához

Skálázhatóság és teljesítmény:
- cache réteg a gyakran keresett játékokhoz
- képek kiszolgálása CDN-ről
- Oldalak paginációval

Rendszer bővíthetősége:
- toplisták, értékelések
- felhasználói kedvencek
- játék összehasonlítás
- API más rendszerek számára



4. Adatmodell / Adatbázis terv





5. Funkcionális tervek / use-case specifikáció
Fő aktorok:
    - Guest
    - RegisteredUser
    - Admin
    - External API

Regisztráció:
    - aktor: Guest
    - megnyitja a regisztráció oldalt
    - kitölti a felhasználónevet és a jelszót
    - a rendszer validálja, és elmenti

Bejelentkezés:
    - aktor: RegisteredUser
    - email és jelsző után token, ami további védett végpontok eléréséhez szükséges

Játékok böngészése:
    - aktor: Guest/RegisteredUser
    - böngész a játékok között, akár szűrővel, részletesen

Üzenet írása az üzenőfalra:
    - aktor: RegisteredUser
    - betöltődik a heti topic, üzenetet ír, és rámegy a mentés gombra ami a messages táblába elmenti az üzenetet és meg is jeleníti azt

Admin beállítja a jövő heti témát:
    - aktor: Admin
    - új "weekly topics" rekordot hoz létra az adatbázisban

GOTY szerkesztése (Game of the Year)
    - aktor: Admin
    - kiválaszt egy évszámot, hozzárendel egy játékot, és elmenti


6. UI/UIX tervek
Főoldal:
    - hero szekció
    - top játékok slider
    - friss hírek
    - linkek a GOTY-hoz, és az üzenőfalhoz

Játékok oldal:
    - bal oldali szűrők (genre, platform)
    - jobbra kártyák (kép, cím,rövid leírás pl ki fejlesztette stb..., "kedvencekhez adás" gomb)
    - 
   

Az év játéka:
    - timeline, cards 10 évre
    - minden év külön díszes kártyával és nagyon fancy effektekkel, animációkkal,
    - kattintható kártyák,a hivatalos játék oldalukra irányít

Üzenőfal:
    - felül "Témák" doboz (hetente más témák), ki lehet választani a témát és oda írni
    - alatta üzenetlista
    - új üzenet űrlap
    - látható mindenkinek az üzenete
    - admin el tudja távolítani az üzenetet ami nem oda illő

Support/Contact:
    - egyszerű form, visszaigazoló üzenettel, pénz küldési lehetőséggel (donate), 
Weben:
- sötét háttér
- neon kék / lila akcentusok (neonos téma)
- bootstrap theme + CSS
- király animációk az egész oldalon
- animált hover effekek gombokon, menüpontokon, shadowing, animált effekek, speciális effectek például van a https://en.bandainamcoent.eu/elden-ring/elden-ring weboldal
- responsive navbar
- responsive oldal
  
