var postcss = require('postcss')
var o = require('mithril/ospec/ospec')
var j2c = require('j2c')
var j2cPostcss = require('../')

var autoprefixer = require('autoprefixer')

var plugin = j2cPostcss(postcss.plugin('plugin', function (opts) {
    opts = opts || {};

    // Work with options here

    return function (css, result) {

        css.walk(function(node){
            if (node.type === 'atrule' && node.params) node.params += 'WAT'
            if (node.type === 'rule') node.selector += ', .postcss'
            if (node.type === 'decl') node.value += 'ish'
        })

    };
}));

o('rudimentary first test', function(){
    o(j2c()
        .use(plugin)
        .sheet({
            '@namespace': 'foo',
            '@media bar':{p:{color:'red'}}
        })
    ).equals("\
@namespace fooWAT;\n\
@media barWAT {\n\
p, .postcss {\n\
color:redish;\n\
}\n\
}\n"
    )
})

o('use autoprefixer to remove prefixes', function(){
    o(j2c().use(j2cPostcss(autoprefixer({ add: false, browsers: [] }))).sheet({'@global':{
        '@-webkit-keyframes foo': {from:{color:'red'}, to:{color:'pink'}},
        '@keyframes bar': {from:{color:'red'}, to:{color:'pink'}}
    }})).equals("\
@keyframes bar {\n\
from {\n\
color:red;\n\
}\n\
to {\n\
color:pink;\n\
}\n\
}\n"
    )
})


o.run()