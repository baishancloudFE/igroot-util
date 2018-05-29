'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Transport = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _transport = require('lokka/transport');

var _transport2 = _interopRequireDefault(_transport);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// 默认网络错误处理
function handleNetErrors(error) {
  throw error;
}

// 默认 HTTP 错误处理
function handleHttpErrors(response) {
  console.log(response);
  throw new Error('Invalid status code: ' + response.status);
}

// 默认 GraphQL 错误处理
function handleGraphQLErrors(errors, data) {
  var message = errors[0].message;

  var error = new Error('GraphQL Error: ' + message);
  error.rawError = errors;
  error.rawData = data;
  throw error;
}
// 业务自定义的错误处理
function handleErrors(responese) {
  var data = responese.data,
      code = responese.code,
      msg = responese.msg;

  var error = new Error('Error: ' + msg);
  throw error;
}

var Transport = exports.Transport = function (_LokkaTransport) {
  _inherits(Transport, _LokkaTransport);

  function Transport(endpoint) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Transport);

    if (!endpoint) throw new Error('endpoint is required!');

    var _this = _possibleConstructorReturn(this, (Transport.__proto__ || Object.getPrototypeOf(Transport)).call(this));

    _this._httpOptions = {
      auth: options.auth,
      headers: options.headers || {},
      credentials: options.credentials
    };

    _this.endpoint = endpoint;
    _this.handleNetErrors = options.handleNetErrors || handleNetErrors;
    _this.handleHttpErrors = options.handleHttpErrors || handleHttpErrors;
    _this.handleGraphQLErrors = options.handleGraphQLErrors || handleGraphQLErrors;
    _this.handleSuccess = options.handleSuccess || function () {};

    _this.needAuth = typeof options.needAuth === 'boolean' ? options.needAuth : true;
    _this.extra = { pagination: {} };
    _this.handleErrors = options.handleErrors || handleErrors;
    // this.errType = options.errType || 'old'
    return _this;
  }

  _createClass(Transport, [{
    key: '_buildOptions',
    value: function _buildOptions(payload) {
      // 默认设置
      var options = {
        method: 'post',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),

        // CORS
        credentials: 'include'
      };

      if (this._httpOptions.credentials === false) delete options.credentials;

      var token = JSON.parse(window.localStorage['jwtToken'] || null);
      Object.assign(options.headers, this._httpOptions.headers, this.needAuth ? { Authorization: token ? 'Bearer ' + token : null } : {});

      return options;
    }
  }, {
    key: 'send',
    value: function send(query, variables, operationName) {
      var _this2 = this;

      var payload = { query: query, variables: variables, operationName: operationName };
      var options = this._buildOptions(payload);

      return fetch(this.endpoint, options).then(function (response) {
        // HTTP 错误处理
        if (response.status !== 200) _this2.handleHttpErrors(response);

        // 获取头部分页信息
        _this2.extra.pagination = {};
        response.headers.forEach(function (val, key) {
          _this2.extra.pagination[key] = val;
        });
        // end
        return response.json();
      }).then(function (responese) {
        if (responese.code && responese.code !== 0) {
          _this2.handleErrors(responese);
        } else if (responese.errors) {
          _this2.handleGraphQLErrors(responese.errors, responese.data);
        } else {
          _this2.handleSuccess(responese);
        }

        // switch (this.errType) {
        //   case 'old':
        //     // 旧框架会返回GraphQL 错误：GraphQL 错误处理
        //     const { data, errors } = responese
        //     if (errors) {
        //       this.handleGraphQLErrors(errors, data)
        //     } else { this.handleSuccess(data) }
        //     break;
        //   case 'new':
        //     // 新的后端框架不返回GraphQL错误
        //     const { data: resultData, code, msg } = responese
        //     if (code !== 0) {
        //       this.handleErrors(responese)
        //     } else { this.handleSuccess(resultData) }
        //     break;
        //   default:
        //     console.log('未指定正确的框架！')
        //     break;
        // }

        //返回所需数据和头部信息
        return Object.assign(responese, _this2.extra);
        // return data
      }).catch(function (err) {
        return _this2.handleNetErrors(err);
      });
    }
  }]);

  return Transport;
}(_transport2.default);