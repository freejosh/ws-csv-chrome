import './any-date-parser';

///
// choosing an element on the page
///

function removeAncestorsClass(node) {
  if (node.classList) {
    node.classList.remove('wscsv-hover');
  }

  const { parentNode } = node;
  if (parentNode && parentNode.classList && parentNode.classList.contains('wscsv-hover')) {
    removeAncestorsClass(parentNode);
  }
}

function chooseMouseover(e) {
  const node = e.target;
  node.classList.add('wscsv-hover');
  removeAncestorsClass(node.parentNode);
}

function chooseMouseout(e) {
  removeAncestorsClass(e.target);
}

function chooseClick(e) {
  e.preventDefault();
  e.stopPropagation();
  chooseMouseout(e);

  document.body.classList.remove('wscsv-choose');
  document.removeEventListener('mouseover', chooseMouseover);
  document.removeEventListener('mouseout', chooseMouseout);
}

// init choose UI. resolves with chosen element
function chooseEl(label) {
  // TODO: if there's a saved selector for label skip this step
  // TODO: instructions with label
  document.body.classList.add('wscsv-choose');
  document.addEventListener('mouseover', chooseMouseover);
  document.addEventListener('mouseout', chooseMouseout);

  return new Promise((resolve) => {
    document.addEventListener('click', (e) => {
      chooseClick(e);
      resolve(e.target);
    }, { once: true, capture: true });
  });
}

///
// matching & filtering elements via querySelector
///

// checks if the selector is valid for querySelector
// - doesn't start with number
// - only contains a-z, 0-9, _, -
function validSel(sel) {
  return !/^[0-9]|[^a-z0-9_-]/i.test(sel);
}

// get the css selector to a node as an array
function getSelectorArr(node) {
  if (!node.tagName) {
    return [];
  }

  const sel = [node.tagName];

  if (node.className) {
    sel.push(...node.className.trim().split(/\s+/).filter(validSel).map((cl) => `.${cl}`));
  }

  if (node.id && validSel(node.id)) {
    sel.push(`#${node.id}`);
  }

  const selParents = [sel];

  if (node.parentNode) {
    selParents.unshift(...getSelectorArr(node.parentNode));
  }

  // structure: [ ['div', '.class', ..., '#id'], ... ]
  // each inner array is parent of subsequent array
  return selParents;
}

// compile the array selector to a string
function compileSelector(selArr) {
  return selArr.map((sels) => sels.join('')).filter((v) => v).join(' > ');
}

// filter the selector to remove specified elements
// excluded keyed by path to item in selArr (e.g. '0.2') - false value to exclude
function getExcludedSel(selArr, excluded) {
  return selArr.map(
    (sels, i) => sels.map(
      (sel, j) => (excluded[`${i}.${j}`] ? '' : sel),
    ),
  );
}

// get elements by the selector+exclusions
function getEls(selArr, excluded) {
  const excludedSel = getExcludedSel(selArr, excluded);
  const compiledSel = compileSelector(excludedSel);
  const els = document.querySelectorAll(compiledSel);

  // filter invisible nodes (e.g. LinkedIn search results has )
  return Array.from(els).filter((node) => {
    const { width, height } = node.getBoundingClientRect();
    return width > 1 && height > 1;
  });
}

function removeHighlights() {
  document.querySelectorAll('.wscsv-match-highlight').forEach((highlighted) => {
    highlighted.classList.remove('wscsv-match-highlight');
  });
}

function addHighlight(node) {
  node.classList.add('wscsv-match-highlight');
}

// init matching UI. resolves when OK button is clicked, with list of matched elements
function matchEls(node) {
  // TODO: show a count for how many nodes selected
  // TODO: if there's a saved selector for this label, load it and allow editing
  // TODO: allow going back to choose node mode
  const selArr = getSelectorArr(node);
  const excluded = {}; // keyed by path to item in selArr (e.g. '0.2') - false value to exclude

  function showMatches() {
    removeHighlights();
    getEls(selArr, excluded).forEach(addHighlight);
  }
  showMatches();

  const filters = document.createElement('div');
  filters.id = 'wscsv-match';
  filters.className = 'wscsv-ui';

  selArr.forEach((sels, i) => {
    sels.forEach((sel, j) => {
      const button = document.createElement('button');
      button.appendChild(document.createTextNode(sel));

      button.onclick = function toggleExclude() {
        const newVal = this.getAttribute('data-excluded') !== 'true';
        this.setAttribute('data-excluded', newVal ? 'true' : 'false');

        excluded[`${i}.${j}`] = newVal;

        showMatches();
      };
      filters.appendChild(button);
    });

    if (i < selArr.length - 1) {
      filters.appendChild(document.createTextNode(' > '));
    }
  });

  document.body.appendChild(filters);

  const okButton = document.createElement('button');
  okButton.appendChild(document.createTextNode('OK'));
  okButton.id = 'wscsv-match-ok';
  okButton.className = 'wscsv-ui';
  document.body.appendChild(okButton);

  return new Promise((resolve) => {
    okButton.onclick = (e) => {
      // TODO: save final selector using chrome storage (per label per URL)
      e.stopPropagation();
      okButton.remove();
      filters.remove();
      removeHighlights();
      resolve(getEls(selArr, excluded));
    };
  });
}

///
// working with DOM elements
///

// is the node a descendent of the parentNode? (or is parentNode itself)
function isDescendant(node, parentNode) {
  if (!node || !parentNode) {
    return false;
  }
  if (node === parentNode) {
    return true;
  }
  return isDescendant(node.parentNode, parentNode);
}

// find where the specified nodes converge as siblings
function closestSiblings(nodeA, nodeB) {
  const parentA = nodeA.parentNode;
  const parentB = nodeB.parentNode;
  if (parentA === parentB) {
    return [nodeA, nodeB];
  }

  // TODO: account for asymmetrical tree: check if parentA contains nodeB (and reverse) - if so
  // we're at the common ancestor and can just go up from nodeB until its parentNode is parentA
  // if (isDescendant(nodeB, parentA)) {

  // }

  return closestSiblings(parentA, parentB);
}

// for each heading, recurse up to the common parent of the next heading. related data is nodes
// between the headings
function dataBetweenHeadings(heading, i, list) {
  const nextHeading = list[i + 1];
  if (!nextHeading) {
    // leftover data will be assigned to last heading
    return { heading };
  }

  const siblings = closestSiblings(heading, nextHeading);
  let groupA = siblings[0];
  const groupB = siblings[1];

  const containers = [];
  while (groupA && groupA !== groupB) {
    if (groupA !== heading && groupA.hasChildNodes()) {
      containers.push(groupA);
    }
    groupA = groupA.nextSibling;
  }
  return { heading, containers };
}

// find the data group in which the node is a descendent of one of its containers. put the node in
// the data group, in an array on a key specified by label
function assignToHeading(data, label, node) {
  const group = data.find(({ containers }) => {
    if (!containers) {
      // leftover data assigned to last heading
      return true;
    }
    return containers.find((parentNode) => isDescendant(node, parentNode));
  });

  if (!group) {
    return;
  }

  if (group[label]) {
    group[label].push(node);
  } else {
    group[label] = [node];
  }
}

///
// entry point
///
(async function main() {
  const formats = {
    date(rawValue) {
      // fromString from any-date-parser
      const date = Date.fromString(rawValue);
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
