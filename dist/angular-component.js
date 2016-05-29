/*! angular-component v0.1.2 | (c) 2016 @toddmotto | https://github.com/toddmotto/angular-component */
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

(function (angular) {

  var ng = angular.module;
  var toString = Object.prototype.toString;

  var identifierForController = function identifierForController(controller, ident) {
    if (ident && typeof ident === 'string') return ident;
    if (typeof controller === 'string') {
      var match = /^(\S+)(\s+as\s+(\w+))?$/.exec(controller);
      if (match) return match[3];
    }
  };

  function module() {

    var hijacked = ng.apply(undefined, arguments);

    if (hijacked.component) {
      return hijacked;
    }

    var UNINITIALIZED_VALUE = function UNINITIALIZED_VALUE() {
      _classCallCheck(this, UNINITIALIZED_VALUE);
    };

    var _UNINITIALIZED_VALUE = new UNINITIALIZED_VALUE();

    var SimpleChange = function () {
      function SimpleChange(previous, current) {
        _classCallCheck(this, SimpleChange);

        this.previousValue = previous;
        this.currentValue = current;
      }

      _createClass(SimpleChange, [{
        key: 'isFirstChange',
        value: function isFirstChange() {
          return this.previousValue === _UNINITIALIZED_VALUE;
        }
      }]);

      return SimpleChange;
    }();

    var component = function component(name, options) {

      var controller = options.controller || function () {};

      var factory = function factory($injector, $parse) {

        var oneWayQueue = [];

        var _parseRequire = parseRequire(options.require);

        var require = _parseRequire.require;
        var controllerNames = _parseRequire.controllerNames;

        var bindings = parseBindings(options.bindings);

        function parseRequire(required) {
          var parsed = {
            require: [name],
            controllerNames: []
          };
          if (toString.call(required) === '[object Object]') {
            for (var prop in required) {
              parsed.require.push(required[prop]);
              parsed.controllerNames.push(prop);
            }
          }
          return parsed;
        }

        function parseBindings(bindings) {
          var parsed = {};
          for (var prop in bindings) {
            var binding = bindings[prop];
            if (binding.charAt(0) === '<') {
              var attr = binding.substring(1);
              oneWayQueue.unshift({
                local: prop,
                attr: attr === '' ? prop : attr
              });
            } else {
              parsed[prop] = binding;
            }
          }
          return parsed;
        }

        function makeInjectable(fn) {
          var isArray = toString.call(fn) === '[object Array]';
          var isFunction = typeof fn === 'function';
          if (isFunction || isArray) {
            return function (tElement, tAttrs) {
              return $injector.invoke(isArray ? fn : ['$element', '$attrs', fn], this, {
                $element: tElement,
                $attrs: tAttrs
              });
            };
          } else {
            return fn;
          }
        }

        function postLink($scope, $element, $attrs, $ctrls) {
          var self = $ctrls[0];
          if (typeof self.$postLink === 'function') {
            self.$postLink();
          }
        }

        function preLink($scope, $element, $attrs, $ctrls) {

          var changes = {};
          var self = $ctrls[0];
          var controllers = controllerNames;

          for (var i = 0; i < controllers.length; i++) {
            self[controllers[i]] = $ctrls[i + 1];
          }

          function updateChangeListener(key, newValue, oldValue, flush) {
            if (typeof self.$onChanges !== 'function') {
              return;
            }
            if (!changes) {
              changes = {};
            }
            if (changes[key]) {
              oldValue = changes[key].currentValue;
            }
            changes[key] = new SimpleChange(oldValue, newValue);
            if (flush) {
              self.$onChanges(changes);
              changes = undefined;
            }
          }

          if (oneWayQueue.length) {
            (function () {
              var destroyQueue = [];

              var _loop = function _loop(q) {

                var current = oneWayQueue[q];
                var initialValue = self[current.local] = $parse($attrs[current.attr])($scope.$parent);
                self[current.local] = initialValue;

                var unbindParent = $scope.$parent.$watch($attrs[current.attr], function (newValue, oldValue) {
                  self[current.local] = newValue;
                  updateChangeListener(current.local, newValue, oldValue, true);
                });
                changes[current.local] = new SimpleChange(_UNINITIALIZED_VALUE, initialValue);
                destroyQueue.unshift(unbindParent);
                var unbindLocal = $scope.$watch(function () {
                  return self[current.local];
                }, function (newValue, oldValue) {
                  updateChangeListener(current.local, newValue, oldValue, false);
                });
                destroyQueue.unshift(unbindLocal);
              };

              for (var q = oneWayQueue.length; q--;) {
                _loop(q);
              }
              self.$onChanges(changes);
              $scope.$on('$destroy', function () {
                for (var _i = destroyQueue.length; _i--;) {
                  destroyQueue[_i]();
                }
              });
            })();
          }

          if (typeof self.$onInit === 'function') {
            self.$onInit();
          }

          if (typeof self.$onDestroy === 'function') {
            $scope.$on('$destroy', function () {
              self.$onDestroy.call(self);
            });
          }
        }

        return {
          controller: controller,
          controllerAs: identifierForController(controller) || options.controllerAs || '$ctrl',
          template: makeInjectable(!options.template && !options.templateUrl ? '' : options.template),
          templateUrl: makeInjectable(options.templateUrl),
          transclude: options.transclude,
          scope: bindings || {},
          bindToController: !!bindings,
          restrict: 'E',
          require: require,
          link: {
            pre: preLink,
            post: postLink
          }
        };
      };

      for (var key in options) {
        if (key.charAt(0) === '$') {
          factory[key] = options[key];
        }
      }

      factory.$inject = ['$injector', '$parse'];

      return hijacked.directive(name, factory);
    };

    hijacked.component = component;

    return hijacked;
  }

  angular.module = module;
})(window.angular);