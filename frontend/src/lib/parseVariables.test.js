import { describe, it, expect } from 'vitest';
import { parseVariables } from './parseVariables';

describe('parseVariables', () => {
  it('extracts a single variable', () => {
    expect(parseVariables('Hello {{ name }}')).toEqual(['name']);
  });

  it('dedupes repeated variables', () => {
    expect(parseVariables('{{ user }} and {{ user }}')).toEqual(['user']);
  });

  it('ignores invalid identifiers', () => {
    expect(parseVariables('{{ 1bad }} {{ a-b }} {{}} {{ ok }}')).toEqual(['ok']);
  });

  it('keeps first-seen order across multiple variables', () => {
    expect(parseVariables('{{ b }} {{ a }} {{ c }} {{ a }}')).toEqual(['b', 'a', 'c']);
  });

  it('tolerates whitespace variants', () => {
    expect(parseVariables('{{user}} {{  user  }} {{ other }}')).toEqual(['user', 'other']);
  });

  it('accepts $ and _ identifiers, returns [] when none', () => {
    expect(parseVariables('{{ _x$1 }}')).toEqual(['_x$1']);
    expect(parseVariables('no variables here')).toEqual([]);
  });
});
