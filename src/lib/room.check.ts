// Autoverificação da sala ao vivo: `npm test`
import assert from 'node:assert/strict'
import { experimentSignature, newRoomCode, roomCode, roomId } from './room.ts'

assert.equal(roomCode('?sala=AbC1'), 'abc1')
assert.equal(roomCode('?sala=ab'), null, 'curto demais')
assert.equal(roomCode('?sala=<script>'), 'script')
assert.equal(roomCode('?sala=abcdefghijkl'), 'abcdefgh')
assert.equal(roomCode(''), null)

// a ordem dos parâmetros e o próprio código da sala não mudam a rodada; outro experimento muda
const a = experimentSignature('?cas=wt&repair=nhej&sala=abcd')
assert.equal(a, experimentSignature('?sala=zzzz&repair=nhej&cas=wt'))
assert.notEqual(a, experimentSignature('?cas=be&repair=nhej'))

assert.match(roomId('abcd', '?cas=wt'), /^[a-z0-9.-]{3,40}$/)
assert.match(newRoomCode(), /^[a-z0-9]{4}$/)
