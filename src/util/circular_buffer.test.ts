import {CircularBuffer} from './circular_buffer';

test('initializes empty', () => {
    const buffer = new CircularBuffer(10, () => {});
    expect(buffer.count).toBe(0);
});

test('CircularBuffer#push and pop order', () => {
    const buffer = new CircularBuffer(10, () => {});
    buffer.push(1);
    buffer.push(2);
    buffer.push(3);

    expect(buffer.pop()).toBe(3);
    expect(buffer.pop()).toBe(2);
    expect(buffer.pop()).toBe(1);
});

test('it invokes evictcb with the evicted', () => {
    const evicted = [];
    const buffer = new CircularBuffer(4, (e) => { evicted.push(e); });
    buffer.push(1);
    buffer.push(2);
    buffer.push(3);
    buffer.push(4);
    buffer.push(5);
    buffer.push(6);
    buffer.push(7);

    expect(evicted[0]).toBe(1);
    expect(evicted[1]).toBe(2);
    expect(evicted[2]).toBe(3);
});

test('it tracks count correctly with push and pop', () => {
    const buffer = new CircularBuffer(4, () => {});
    buffer.push(1);
    buffer.push(2);
    buffer.push(3);

    expect(buffer.count).toBe(3);
    buffer.pop();
    expect(buffer.count).toBe(2);
    buffer.push(3);
    buffer.push(4);
    buffer.push(5);
    buffer.push(6);
    // count stays at max, because of evictions
    expect(buffer.count).toBe(4);
});
