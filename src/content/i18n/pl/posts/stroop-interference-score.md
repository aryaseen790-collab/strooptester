---
title: Jak rozumieć swój wynik interferencji w teście Stroopa
seoTitle: "Wynik interferencji Stroopa: co oznacza i jak się go liczy"
description: Co mierzy wynik interferencji Stroopa, jak oblicza się go krok po kroku, dlaczego usuwa surową szybkość, jaki wynik jest normalny i jak odczytać swój.
imageAlt: Wzór na wynik interferencji Stroopa przedstawiony jako odejmowanie
excerpt: Wynik interferencji to jedno odejmowanie, ale to właśnie ta liczba jest powodem istnienia testu Stroopa. Oto, co się na nią składa i jak odczytać swoją.
keywords: wynik interferencji stroopa, wynik interferencji, wynik stroopa, jak obliczyć interferencję stroopa, punktacja testu stroopa
summary: Interferencja Stroopa = mediana czasu dla słów sprzecznych minus mediana czasu dla słów zgodnych.|Odjęcie czasu dla słów zgodnych usuwa twoje ogólne tempo i większość opóźnienia urządzenia.|W testach na klawiaturę lub ekran dotykowy dorośli zwykle uzyskują około 40–120 ms.
---

Po teście Stroopa dostajesz kilka liczb. Większość to te, których się spodziewasz: ile odpowiedzi było dobrych i jak szybko szło. Jedna jest inna. Wynik interferencji nie mierzy szybkości jako takiej. Mierzy, jak bardzo spowolniła cię jedna konkretna rzecz: nazwa koloru wydrukowana niewłaściwym kolorem.

To jedno odejmowanie i właśnie dla tej liczby test powstał. Jeśli jeszcze nie zrobiłeś testu, [zrób go najpierw](/#test), żeby mieć przed oczami swoją liczbę podczas lektury.

## Co oznacza ta liczba

Test Stroopa miesza kilka rodzajów prób. W próbie **zgodnej** (kongruentnej) słowo i kolor druku się zgadzają: CZERWONY na czerwono. W próbie **sprzecznej** (niekongruentnej) nie: CZERWONY na niebiesko. Wiele wersji, w tym nasza, dodaje próby **neutralne**, w których zwykłe słowo, takie jak LAMPA, pojawia się w kolorze, więc żadna nazwa koloru nie przeszkadza.

Dla kogoś, kto czyta płynnie, czytanie nie jest opcjonalne. Słowo zostaje przetworzone, czy tego chcesz, czy nie, a w próbie sprzecznej wskazuje złą odpowiedź. Musisz je powstrzymać, zanim podasz kolor druku. Twój wynik interferencji to koszt tego powstrzymania, w milisekundach.

Jeśli chcesz zrozumieć, dlaczego czytanie tak się wpycha, artykuł [efekt Stroopa wyjaśniony](/stroop-effect-explained/) omawia to szczegółowo.

## Jak się go oblicza

Na tej stronie obliczenie ma trzy kroki.

1. Weź swoje poprawne odpowiedzi w próbach zgodnych i znajdź **medianę** czasu. Mediana to środkowa wartość po uporządkowaniu czasów. Używamy jej zamiast średniej, bo jedna wolna odpowiedź, na przykład gdy mrugnąłeś albo spojrzałeś w bok, prawie jej nie zmienia.
2. Zrób to samo dla prób sprzecznych.
3. Odejmij pierwszą liczbę od drugiej.

![Schemat czasu reakcji w próbach niekongruentnych minus kongruentnych](/wp-content/uploads/2026/09/Incongruent-minus-congruent.webp "Różnica między dwoma rodzajami prób to twój wynik. Liczby są tylko przykładem.")

Powiedzmy, że twoja mediana dla słów zgodnych to 560 ms, a dla sprzecznych 650 ms. Twoja interferencja wynosi 90 ms. Tyle dodatkowego czasu kosztował cię konflikt.

Wcześniej działają dwa filtry. Odpowiedzi poniżej 200 ms są odrzucane, bo nikt nie jest w stanie naprawdę zobaczyć koloru i zdecydować tak szybko, więc to strzały. Odpowiedzi powyżej 3 sekund też są odrzucane, bo wtedy działo się coś innego niż zadanie. Błędne odpowiedzi nie liczą się do pomiaru czasu, ale obniżają trafność.

### Inne sposoby liczenia

Nie każdy test robi to w ten sposób. Niektóre jako punkt odniesienia biorą próby neutralne zamiast zgodnych, co daje koszt konfliktu bez małego wsparcia, jakie daje słowo zgodne. Nasz raport pokazuje również tę wersję.

Papierowy test Stroopa Goldena, często używany przez klinicystów, działa na zupełnie innej zasadzie. Na trzech kartach (słowa, plamy koloru i sprzeczne nazwy kolorów) nazywa się w 45 sekund jak najwięcej elementów, a wynik interferencji porównuje trzecią kartę z sumą przewidzianą na podstawie dwóch pierwszych. Ta sama idea, inna miarka, więc nie da się porównać wyniku Goldena z wynikiem w milisekundach ze strony internetowej.

## Dlaczego pomija surową szybkość

Surowe czasy trudno interpretować. Wyobraź sobie dwie osoby, które przy słowach sprzecznych potrzebują po 800 ms. Jedna jest szybka we wszystkim i konflikt mocno ją wybił z rytmu. Druga po prostu naciska wolno i ostrożnie, a z konfliktem poradziła sobie dobrze. 800 ms całkowicie ukrywa tę różnicę.

Odjęcie czasu dla słów zgodnych to naprawia, bo ten czas zawiera już twoje tempo czytania, szybkość palców i opóźnienie klawiatury. Gdy go usuniesz, zostaje głównie sam konflikt. Dlatego badacze zwykle podają różnicę, a nie surowy czas.

![Rozkład czasów reakcji z zaznaczoną medianą](/wp-content/uploads/2026/09/Reaction-time-distribution.webp "Czasy reakcji skupiają się z długim ogonem wolnych odpowiedzi, dlatego mediana jest bezpieczniejszym podsumowaniem niż średnia.")

W testach online jest jeszcze druga korzyść. Klawiatury, ekrany dotykowe i monitory dodają własne opóźnienia, często kilkadziesiąt milisekund, i różnią się one między urządzeniami. Ponieważ oba rodzaje prób mierzy się na tym samym urządzeniu, większość opóźnienia jest w obu liczbach i znika przy odejmowaniu.

## Jaki zakres jest normalny?

Nie ma oficjalnego progu, bo liczba zależy od wersji zadania, liczby kolorów i sposobu odpowiadania. Naciskanie klawiszy daje na przykład mniejszą interferencję niż mówienie kolorów na głos. W wersjach na klawiaturę i ekran dotykowy, takich jak nasza, dorośli zwykle mieszczą się w okolicach 40–120 ms. Nasz raport opisuje wyniki przybliżonymi przedziałami:

- **Poniżej 40 ms**: bardzo mała
- **40–120 ms**: typowa
- **120–200 ms**: nieco większa
- **200 ms lub więcej**: duża

Traktuj je jako przybliżoną wskazówkę, a nie diagnozę. Nie są skorygowane o wiek i nie pochodzą z formalnej próby normalizacyjnej.

### Wiek i druga liczba w twoim raporcie

Interferencja ma tendencję do wzrostu w późniejszym wieku. Jednak znana metaanaliza Paula Verhaeghena i Liesbeth De Meersman z 1998 roku wykazała, że większość tego wzrostu wynika z ogólnego spowolnienia. Starsi dorośli są nieco wolniejsi niemal we wszystkim, więc każda różnica się rozciąga, także ta.

Dlatego raport pokazuje też **interferencję względną**: różnicę jako procent twojej własnej szybkości dla słów zgodnych. Jeśli potrzebujesz 560 ms dla słów zgodnych i 650 ms dla sprzecznych, twoja interferencja względna wynosi około 16%. Zmienia się z wiekiem dużo mniej niż surowa różnica, więc jest uczciwszą liczbą, gdy porównujesz się z kimś o trzydzieści lat młodszym lub starszym. Nasz poradnik o tym, [jaki wynik testu Stroopa jest dobry](/good-stroop-test-score/), mówi więcej o czytaniu wyników według wieku.

![Wykres liniowy wzrostu interferencji z wiekiem](/wp-content/uploads/2026/09/Interference-by-age.webp "Ilustracja ogólnego trendu. Wartości są wymyślone na potrzeby rysunku, a nie wzięte z badania.")

## Gdy twój wynik jest wysoki

Najczęściej wysoki wynik ma nudne wyjaśnienie. Za mało snu, kac, hałaśliwy pokój, niewygodna klawiatura laptopa albo po prostu to, że robisz test pierwszy raz. Pierwsze podejście bywa najwolniejsze.

Jeśli wynik raz po raz jest wysoki, w dobrych warunkach, to ciekawsze, ale wciąż nie jest to diagnoza. W badaniach grupy osób z ADHD, depresją lub urazem mózgu wykazują średnio nieco większą interferencję. Nakładanie się z resztą ludzi jest jednak ogromne. Wiele osób z tymi zaburzeniami ma wynik typowy, a wiele osób bez nich ma wynik wysoki. Jeśli martwisz się o swoją uwagę, sensownym krokiem jest rozmowa z lekarzem, a nasz tekst o tym, [czy test online może zdiagnozować ADHD](/online-adhd-attention-test/), wyjaśnia dlaczego.

## Jak uzyskać wiarygodną liczbę

Jeden wynik to migawka. Kilka uzyskanych w tych samych warunkach mówi dużo więcej. Pomaga kilka nawyków:

- Rób test o tej samej porze dnia, na tym samym urządzeniu, w cichym miejscu.
- Najpierw zrób rundę próbną, żeby nauka klawiszy nie mieszała się z wynikiem.
- Do śledzenia postępów używaj poziomu Standardowego. Czterdzieści prób daje stabilniejszą medianę niż dwadzieścia.
- Nie powtarzaj go dziesięć razy z rzędu. Staniesz się szybszy w grze, a to nie to samo co lepsza uwaga.

Test zapisuje ostatnie wyniki w przeglądarce, więc możesz obserwować liczbę przez kilka tygodni.

{{cta: Poznaj swój wynik interferencji. Test Standardowy ma 40 prób i trwa około dwóch minut.}}

## Najczęściej zadawane pytania

### Czym jest wynik interferencji Stroopa?

To dodatkowy czas, którego potrzebujesz, żeby podać kolor druku, gdy słowo oznacza inny kolor. Na tej stronie to mediana twojego czasu w próbach sprzecznych minus mediana czasu w próbach zgodnych, liczona tylko z poprawnych odpowiedzi.

### Dlaczego mediana, a nie średnia?

Czasy reakcji mają długi ogon. Jedna wolna odpowiedź, przez kichnięcie albo zerknięcie na telefon, potrafi mocno podnieść średnią. Mediana prawie się nie zmienia, więc lepiej oddaje, jak zwykle odpowiadałeś.

### Jaki wynik interferencji jest normalny?

W wersjach na klawiaturę i ekran dotykowy wielu dorosłych mieści się między około 40 a 120 ms. Zależy to od konstrukcji testu, więc porównuj wyniki z tego samego testu, najlepiej z własnymi wcześniejszymi wynikami.

### Czy błędy wpływają na wynik?

Błędne odpowiedzi są pomijane przy liczeniu czasu, więc nie zmieniają bezpośrednio interferencji. Obniżają za to trafność, pokazywaną osobno. Szybki wynik z wieloma błędami to nie jest mocny rezultat.

### Czym jest interferencja względna?

To twoja interferencja wyrażona jako procent czasu dla słów zgodnych. Ponieważ eliminuje ogólne tempo, jest uczciwsza przy porównywaniu ludzi w różnym wieku lub na różnych urządzeniach.

### Czy mój wynik interferencji może być ujemny?

Czasami, w krótkim teście. Zwykle oznacza to bardzo mało prób sprzecznych albo kilka wolnych odpowiedzi przy słowach zgodnych. Zrób ponownie test Standardowy, a niemal zawsze wyjdzie dodatni.

### Czy wiek wpływa na interferencję?

Surowa różnica zwykle rośnie z wiekiem, ale głównie dlatego, że wszystko trochę zwalnia. Interferencja względna zmienia się dużo mniej, dlatego pokazujemy obie.

### Czy mogę obniżyć swój wynik?

Trochę. Dobry sen, cichy pokój i znajomość klawiszy pomagają od razu. Regularny wysiłek aerobowy ma pewne potwierdzenie w badaniach jako wsparcie funkcji wykonawczych w ogóle. Spodziewaj się niewielkich zmian i patrz na trend z kilku sesji.
