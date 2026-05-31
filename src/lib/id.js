let _idc = 1000;

export function uid(prefix) {
  _idc += 1;
  return (prefix || 'id') + '_' + _idc;
}
