type Quote = {
  ticker: string;
  price: string;
  change_amount: string;
  change_percentage: string;
  volume?: string;
};

type TopMoversPayload = {
  limit: number;
  topGainers: Quote[];
  topLosers: Quote[];
  mostActivelyTraded: Quote[];
};

type ToolMessage = {
  type: string;
  data?: unknown;
};

type ToolResponse = {
  content: ToolMessage[];
};

declare global {
  interface Window {
    openai?: {
      callTool: (name: string, args: Record<string, unknown>) => Promise<ToolResponse>;
    };
  }
}

const DEFAULT_LIMIT = 5;

const parsePayload = (response: ToolResponse): TopMoversPayload | undefined => {
  const message = response.content.find((item) => item.type === 'json');
  if (!message || typeof message.data !== 'object' || message.data === null) {
    return undefined;
  }
  const payload = message.data as Partial<TopMoversPayload>;
  if (!payload.topGainers || !payload.topLosers || !payload.mostActivelyTraded || !payload.limit) {
    return undefined;
  }
  return {
    limit: payload.limit,
    topGainers: payload.topGainers,
    topLosers: payload.topLosers,
    mostActivelyTraded: payload.mostActivelyTraded,
  };
};

const createTable = (title: string, rows: Quote[]): HTMLElement => {
  const wrapper = document.createElement('section');
  wrapper.className = 'table-wrapper';

  const heading = document.createElement('h2');
  heading.textContent = title;
  heading.className = 'table-title';
  wrapper.appendChild(heading);

  const table = document.createElement('table');
  table.className = 'movers-table';

  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th scope="col">Ticker</th>
      <th scope="col">Price</th>
      <th scope="col">Change</th>
      <th scope="col">% Change</th>
      <th scope="col">Volume</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td data-label="Ticker">${row.ticker}</td>
      <td data-label="Price">${row.price}</td>
      <td data-label="Change">${row.change_amount}</td>
      <td data-label="% Change">${row.change_percentage}</td>
      <td data-label="Volume">${row.volume ?? '—'}</td>
    `;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrapper.appendChild(table);
  return wrapper;
};

const renderPayload = (container: HTMLElement, payload: TopMoversPayload) => {
  container.innerHTML = '';
  container.appendChild(createTable('Top Gainers', payload.topGainers));
  container.appendChild(createTable('Top Losers', payload.topLosers));
  container.appendChild(createTable('Most Actively Traded', payload.mostActivelyTraded));
};

const displayError = (container: HTMLElement, message: string) => {
  container.innerHTML = '';
  const div = document.createElement('div');
  div.className = 'error-message';
  div.textContent = message;
  container.appendChild(div);
};

const attachHandlers = () => {
  const form = document.querySelector<HTMLFormElement>('#controls');
  const limitField = document.querySelector<HTMLInputElement>('#limit');
  const resultContainer = document.querySelector<HTMLDivElement>('#results');
  const status = document.querySelector<HTMLParagraphElement>('#status');

  if (!form || !limitField || !resultContainer || !status) {
    return;
  }

  const invoke = async () => {
    if (!window.openai?.callTool) {
      displayError(resultContainer, 'OpenAI Apps SDK is not available in this environment.');
      status.textContent = '';
      return;
    }

    const limit = Number.parseInt(limitField.value, 10) || DEFAULT_LIMIT;
    status.textContent = 'Loading latest market movers…';
    resultContainer.innerHTML = '';

    try {
      const response = await window.openai.callTool('topMovers', { limit });
      const payload = parsePayload(response);
      if (!payload) {
        displayError(resultContainer, 'Received an unexpected response from the topMovers tool.');
        status.textContent = '';
        return;
      }
      renderPayload(resultContainer, payload);
      status.textContent = `Showing top ${payload.limit} results from Alpha Vantage.`;
    } catch (error) {
      console.error(error);
      displayError(resultContainer, 'Unable to load market movers. Please try again.');
      status.textContent = '';
    }
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    invoke();
  });

  invoke();
};

document.addEventListener('DOMContentLoaded', attachHandlers);
