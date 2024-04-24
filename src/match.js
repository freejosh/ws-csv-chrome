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
export default function matchEls(node) {
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
