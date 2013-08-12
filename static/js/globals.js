define(['underscore', 'config'], function (_, config) {
    console.log(config)
    var globals = {  };
    _.extend(globals, config);
    return globals;
});