// find a b
export const ignoredHeaders = [
  'host',
  'method',
  'path',
  'scheme',
  'version',
  'Api-Access-Key',
  'Authorization',
];

/**
 * see https://fetch.spec.whatwg.org/#methods
 *
 * @export
 * @param {any} options
 * @returns {string}
 */
export const generateMethod = (options) => {
  const method = options.method;

  if (!method) return '';
  const type = {
    GET: ' -X GET',
    POST: ' -X POST',
    PUT: ' -X PUT',
    PATCH: ' -X PATCH',
    DELETE: ' -X DELETE',
    HEAD: ' -X HEAD',
    OPTIONS: ' -X OPTIONS',
  };

  return type[method.toUpperCase()] || '';
};

/**
 * @export
 * @param {any} val
 * @returns true if the envirtonment supports Headers and val is of instance Headers
 */
export const isInstanceOfHeaders = (val) => {
  if (typeof Headers !== 'function') {
    /**
     * Environment does not support the Headers constructor
     * old internet explorer?
     */
    return false;
  }

  return val instanceof Headers;
};

/**
 * @typedef {Object} HeaderParams
 * @property {Boolean} isEncode - A flag which is set to true if the request should set the --compressed flag
 * @property {String} params - The header params as string
 */

const getHeaderString = (name, val) => {
  if (!val) {
    return '';
  }

  return ` -H "${name}: ${val.replace(/(\\|")/g, '\\$1')}"`;
};

/**
 * @export
 * @param {object={}} options
 * @param {object|Headers} options.headers
 * @returns {HeaderParams} An Object with the header info
 */
export const generateHeader = (options = {}) => {
  const { headers } = options;
  let isEncode = false;
  let headerParam = '';

  if (isInstanceOfHeaders(headers)) {
    headers.forEach((val, name) => {
      if (ignoredHeaders.indexOf(name) === -1) {
        if (name.toLocaleLowerCase() !== 'content-length') {
          headerParam += getHeaderString(name, val);
        }

        if (name.toLocaleLowerCase() === 'accept-encoding') {
          isEncode = true;
        }
      }
    });
  } else if (headers) {
    Object.keys(headers)
      .filter((name) => ignoredHeaders.indexOf(name) === -1)
      .map((name) => {
        if (name.toLocaleLowerCase() !== 'content-length') {
          headerParam += getHeaderString(name, headers[name]);
        }

        if (name.toLocaleLowerCase() === 'accept-encoding') {
          isEncode = true;
        }
      });
  }

  return {
    params: headerParam,
    isEncode,
  };
};

/**
 *
 *
 * @export
 * @param {Object} body
 * @returns {string}
 */
export function generateBody(body) {
  if (!body) return '';
  if (typeof body === 'object') {
    if (body?.has) {
      return ` --data-urlencode '${body.toString()}'`;
    }

    return ` --data-binary '${JSON.stringify(body)}'`;
  }

  return ` --data-binary '${body}'`;
}

/**
 *
 *
 * @export
 * @param {boolean} isEncode
 * @return {string}
 */
export function generateCompress(isEncode) {
  return isEncode ? ' --compressed' : '';
}

/**
 *
 *
 * @export
 * @param {string|object} requestInfo
 * @param {object={}} requestInit
 */
export const getCurl = (requestInfo, requestInit) => {
  let url;
  let options;

  /**
   * initialization with an empty object is done here to
   * keep everything backwards compatible to 0.4.0 and below
   */
  if (typeof requestInfo === 'string') {
    url = requestInfo;
    options = requestInit || {};
  } else {
    url = (requestInfo || {}).url;
    options = requestInfo || {};
  }

  const { body } = options;
  const headers = generateHeader(options);

  return `curl '${url}'${generateMethod(options)}${
    headers.params || ''
  }${generateBody(body)}${generateCompress(headers.isEncode)}`;
};
