// Copyright 2018-2019 the Deno authors. All rights reserved. MIT license.
import { HttpHeaders } from './headers.ts';
import { assertEquals } from '../testing/asserts.ts';
import { test } from '../testing/mod.ts';

test({
  name: '[HTTP] HttpHeaders Properties',
  fn(): void {
    let headers = new HttpHeaders();
    assertEquals(headers.has('cookie'), false);
    assertEquals(headers.get('cookie'), null);
    
    headers.set('Cookie', 'hey=kid');
    assertEquals((headers.get('cookie')), 'hey=kid');
    assertEquals(headers.has('cookie'), true);

    headers.append('Cookie', 'you=want');
    assertEquals((headers.get('cookie')), 'hey=kid; you=want');
    assertEquals(headers.has('cookie'), true);

    headers.append('Cookie', 'a=job');
    assertEquals((headers.get('cookie')), 'hey=kid; you=want; a=job');
    assertEquals(headers.has('cookie'), true);

    headers.delete('Cookie');
    assertEquals(headers.has('cookie'), false);
    assertEquals(headers.get('cookie'), null);

    headers.set('Cookie', 'i=want');
    assertEquals((headers.get('cookie')), 'i=want');
    assertEquals(headers.has('cookie'), true);

    headers.set('Cookie', 'those=pictures');
    assertEquals((headers.get('cookie')), 'those=pictures');
    assertEquals(headers.has('cookie'), true);

    headers.append('Cookie', 'of=spiderman');
    assertEquals((headers.get('cookie')), 'those=pictures; of=spiderman');
    assertEquals(headers.has('cookie'), true);

    headers.delete('Cookie');
    assertEquals(headers.has('cookie'), false);
    assertEquals(headers.get('cookie'), null);
  }
})
