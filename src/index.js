var postcss = require('postcss')

function n () {
	var r=(Math.random()*0x100000000).toString(16)
	return('00000000'+r).slice(r.length) // zero pad to 8 characters.
}

var token = n()+n()+n()+n()

var own = {}.hasOwnProperty
function unknownBlock(type){
	throw new Error('j2c-plugin-postcss doesn\'t know how to handle PostCSS nodes of type "' + type + '".')
}

module.exports = function(plugin) {
	return function(){
		// cache the PostCSS processor. Its creation is delayed so that 
		// more plugins can be added through $postcss
		var processor

		return {$filter: function(next) {
			// combines successive `j2c-postcss-plugin`-based plugins for efficiency.
			if (own.call(next,'$postcss')) return next.$postcss(plugin)

			var plugins = [plugin]
			var parent, root, done

			// `handlers` and `block` turn the PostCSS tree into
			// j2c streams after processing.

			var handlers = {
				atrule: function (node) {
					if (node.nodes) {
						var space, params = space = ''
						if (node.params) {
							params = node.params
							space = ' '
						}
						next.a('@'+node.name, params, true)
						block(node.nodes)
						next.A('@'+node.name, params)
					} else {
						next.a('@'+node.name, node.params)
					}
				},
				comment: function (node) {
					// unserialize the preserved, raw declaration.
					if (node.text.indexOf(token) === 0) next.d('', '', node.text.slice(32), ';\n')
				},
				decl: function (node) {
					next.d(node.prop, node.value, ';\n')
				},
				rule: function (node) {
					next.s(node.selector)
					block(node.nodes)
					next.S(node.selector)
				}
			}

			function block(nodes) {
				nodes.forEach(function (node) {
					(handlers[node.type]||unknownBlock(node.type))(node)
				})
			}

			// These filters turn the streams into a PostCSS tree.
			// Once done, `this.x()` turns back the tree into a
			// series of streams.
			return {
				$postcss: function(plugin) {
					plugins = [plugin].concat(plugins)
					return this
				},
				i: function(){
					parent = postcss.root()
					root = parent
					done = false
					next.i()
				},
				x: function() {
					if (!done) {
						done = true
						// initialize the processor if needed
						processor = processor || postcss(plugins)
						if (root !== parent) throw new Error("Missing '}'")
						var options = {stringifier: function () {}}
						var result = root.toResult(options)

						// process and convert back to j2c streams
						block(processor.process(result, options).root.nodes)
					}
					return next.x.apply(next, arguments)
				},
				a: function(rule, params, takesBlock) {
					var node = {name: rule.slice(1)}
					if (params !== '') node.params = params
					node = postcss.atRule(node)
					parent.push(node)
					if (takesBlock) {
						node.nodes = []
						parent = node
					}
				},
				A: function () {
					parent = parent.parent
				},
				d: function (prop, value) {
					if (prop !== '') parent.push(postcss.decl({prop: prop, value: value}))
					// serialize the 
					else parent.push(postcss.comment({text: token + value}))
				},
				s: function (selector) {
					var rule = postcss.rule({selector: selector})
					parent.push(rule)
					parent = rule
				},
				S: function () {
					parent = parent.parent
				}
			}
		}}
	}
}
