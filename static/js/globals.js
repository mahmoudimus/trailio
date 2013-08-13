define(['underscore', 'config'], function (_, config) {
    var globals = {  };
    _.extend(globals, config);
    return globals;
});