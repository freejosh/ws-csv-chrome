import dateParser from 'any-date-parser';
import chooseEl from './choose';
import matchEls from './match';
import {
  dataBetweenHeadings,
  assignToHeading,
} from './dom';

(async function main() {
  const formats = {
    date(rawValue) {
      const date = dateParser.fromString(rawValue);
      const d = date.getUTCDate();
      const m = date.getUTCMonth() + 1;
      const y = date.getUTCFullYear();
      return `${d}/${m}/${y}`;
    },
    amount(rawValue) {
      return rawValue
        .replaceAll('−', '-') // em dash -> regular dash
        .replaceAll(/[^0-9.-]/gi, '');
    },
  };

  // TODO: create instructions
  const headingNodes = await matchEls(await chooseEl('date'));

  // [
  //  {
  //    heading: <node>
  //    containers: [<node>, ...],
  //    [label]: [<node>, ...],
  //  },
  //  ...
  // ]
  const data = Array.from(headingNodes).map(dataBetweenHeadings);

  const labels = ['name', 'amount'];
  for await (const label of labels) { // eslint-disable-line no-restricted-syntax
    const nodes = await matchEls(await chooseEl(label));
    nodes.forEach((node) => assignToHeading(data, label, node));
  }

  // console.log(data);

  let csv = `date,${labels.join(',')}\n`;
  csv += data.map((group) => {
    const heading = formats.date(group.heading.textContent.trim());

    // assume each label array has same number of items & each index corresponds to other arrays.
    // TODO: can we get rid of the assumption? grouping by common ancestor?
    return group[labels[0]].map((_, i) => { // use first label array as indexer
      const cols = labels.map((label) => {
        const format = formats[label];

        const nodes = group[label];
        if (!nodes) {
          return '""';
        }
        const node = nodes[i];
        if (!node) {
          return '""';
        }

        const rawValue = node.textContent.trim();

        const value = format ? format(rawValue) : rawValue;

        return `"${value}"`;
      });
      return `"${heading}",${cols.join(',')}`;
    }).join('\n');
  }).join('\n');

  // console.log(csv);

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  window.open(url);
}());
