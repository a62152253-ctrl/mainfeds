import test from 'node:test';
import assert from 'node:assert/strict';
import { isNsfwImage, isSafeImage, isBlockedUrl, filterBlockedUrlsInText, filterSwearWords } from '../src/utils/contentFilter';

test('Rozpoznaje i blokuje obrazy NSFW z Wikimedia / zapytań o technologie (np. TypeScript bodypaint)', () => {
  // Przypadek ze zgłoszenia użytkownika: hasło "TypeScript" powiązane z grafiką bodypainting/nude
  assert.equal(
    isNsfwImage({
      url: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/TypeScript_Bodypainting_Model_Nude.jpg',
      title: 'TypeScript Bodypainting Model Nude',
      caption: 'Model with body painting showing programming language',
    }),
    true
  );

  assert.equal(
    isSafeImage('https://upload.wikimedia.org/wikipedia/commons/1/1a/TypeScript_Bodypainting_Model_Nude.jpg'),
    false
  );
});

test('Blokuje obrazy o charakterze nagości, topless, erotyki i aktów', () => {
  const unsafeExamples = [
    { url: 'https://images.example.com/topless_beach.jpg', title: 'Topless sunbathing' },
    { url: 'https://images.example.com/art_nude_photo.png', title: 'Akt kobiecy w studiu' },
    { url: 'https://images.example.com/sensual_erotic_model.webp', title: 'Erotic model shooting' },
    { url: 'https://images.example.com/gallery/breast_close_up.jpg', title: 'Galeria' },
    { url: 'https://images.example.com/naked_man_sculpture_provocative.jpg', title: 'Naked photo' },
  ];

  for (const item of unsafeExamples) {
    assert.equal(isNsfwImage(item), true, `Powinien zablokować: ${item.title}`);
    assert.equal(isSafeImage(item.url, item.title), false);
  }
});

test('Przepuszcza w 100% bezpieczne ilustracje techniczne, naukowe i encyklopedyczne', () => {
  const safeExamples = [
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg.png',
      title: 'TypeScript Official Logo',
      caption: 'Oficjalne logo języka programowania TypeScript',
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Python-logo-notext.svg/1200px-Python-logo-notext.svg.png',
      title: 'Python Logo',
      caption: 'Logo Python Software Foundation',
    },
    {
      url: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
      title: 'Circuit Board Electronics',
      caption: 'Płyta główna i mikroprocesor',
    },
    {
      url: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Warszawa_Centrum_Panorama.jpg',
      title: 'Panorama Warszawy',
      caption: 'Widok na centrum Warszawy',
    },
  ];

  for (const item of safeExamples) {
    assert.equal(isNsfwImage(item), false, `Powinien uznać za bezpieczny: ${item.title}`);
    assert.equal(isSafeImage(item.url, item.title, item.caption), true);
  }
});

test('Odrzuca nieprawidłowe lub niebezpieczne schematy URL dla obrazów', () => {
  assert.equal(isSafeImage('javascript:alert(1)'), false);
  assert.equal(isSafeImage('vbscript:msgbox'), false);
  assert.equal(isSafeImage(''), false);
  assert.equal(isSafeImage(undefined), false);
});

test('Wykrywa i neutralizuje domeny pornograficzne oraz zablokowane adresy w tekście', () => {
  assert.equal(isBlockedUrl('https://pornhub.com/video'), true);
  assert.equal(isBlockedUrl('https://onlyfans.com/model'), true);
  assert.equal(isBlockedUrl('https://xvideos.com/view'), true);
  assert.equal(isBlockedUrl('https://wikipedia.org/wiki/TypeScript'), false);

  const textWithAdultUrl = 'Sprawdź ten link: https://pornhub.com/test oraz oficjalną stronę https://typescriptlang.org';
  const filtered = filterBlockedUrlsInText(textWithAdultUrl);
  assert.ok(filtered.includes('[ZABLOKOWANY LINK 18+]'));
  assert.ok(filtered.includes('https://typescriptlang.org'));
});
