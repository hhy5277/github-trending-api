import _regeneratorRuntime from '@babel/runtime/regenerator';
import _asyncToGenerator from '@babel/runtime/helpers/asyncToGenerator';
import fetch from 'node-fetch';

var SERVER_URL = 'https://github-trending-api.now.sh';

function buildUrl(baseUrl) {
  var params =
    arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var queryString = Object.keys(params)
    .map(function(key) {
      return ''.concat(key, '=').concat(params[key]);
    })
    .join('&');
  return queryString === ''
    ? baseUrl
    : ''.concat(baseUrl, '?').concat(queryString);
}

function fetchAllLanguages() {
  return _fetchAllLanguages.apply(this, arguments);
}

function _fetchAllLanguages() {
  _fetchAllLanguages = _asyncToGenerator(
    /*#__PURE__*/
    _regeneratorRuntime.mark(function _callee() {
      var data;
      return _regeneratorRuntime.wrap(
        function _callee$(_context) {
          while (1) {
            switch ((_context.prev = _context.next)) {
              case 0:
                _context.next = 2;
                return fetch(''.concat(SERVER_URL, '/languages'));

              case 2:
                data = _context.sent;
                return _context.abrupt('return', data.json());

              case 4:
              case 'end':
                return _context.stop();
            }
          }
        },
        _callee,
        this
      );
    })
  );
  return _fetchAllLanguages.apply(this, arguments);
}

function fetchRepositories(_x) {
  return _fetchRepositories.apply(this, arguments);
}

function _fetchRepositories() {
  _fetchRepositories = _asyncToGenerator(
    /*#__PURE__*/
    _regeneratorRuntime.mark(function _callee2(params) {
      var data;
      return _regeneratorRuntime.wrap(
        function _callee2$(_context2) {
          while (1) {
            switch ((_context2.prev = _context2.next)) {
              case 0:
                _context2.next = 2;
                return fetch(
                  buildUrl(''.concat(SERVER_URL, '/repositories'), params)
                );

              case 2:
                data = _context2.sent;
                return _context2.abrupt('return', data.json());

              case 4:
              case 'end':
                return _context2.stop();
            }
          }
        },
        _callee2,
        this
      );
    })
  );
  return _fetchRepositories.apply(this, arguments);
}

function fetchDevelopers(_x2) {
  return _fetchDevelopers.apply(this, arguments);
}

function _fetchDevelopers() {
  _fetchDevelopers = _asyncToGenerator(
    /*#__PURE__*/
    _regeneratorRuntime.mark(function _callee3(params) {
      var data;
      return _regeneratorRuntime.wrap(
        function _callee3$(_context3) {
          while (1) {
            switch ((_context3.prev = _context3.next)) {
              case 0:
                _context3.next = 2;
                return fetch(
                  buildUrl(''.concat(SERVER_URL, '/developers'), params)
                );

              case 2:
                data = _context3.sent;
                return _context3.abrupt('return', data.json());

              case 4:
              case 'end':
                return _context3.stop();
            }
          }
        },
        _callee3,
        this
      );
    })
  );
  return _fetchDevelopers.apply(this, arguments);
}

export { fetchAllLanguages, fetchRepositories, fetchDevelopers };
