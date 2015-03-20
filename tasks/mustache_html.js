/*
 * grunt-mustache-html
 * https://github.com/haio/grunt-mustache-html
 *
 * Copyright (c) 2013 zhongyu
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('mustache_html', 'Compile mustache|hbs templates to HTML', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      src: 'src',
      dist: 'dist',
      type: 'mustache'
    });

    var globals = this.data.globals || {};

    var fs = require('fs'),
        hogan = require('hogan.js'),
        jstSuffix = '.' + options.type,
        matcher = new RegExp('\\' + jstSuffix + '$'),
    partialsMatcher = new RegExp('partials');

    // jsts path
    var layoutPath = options.src + '/layout' + jstSuffix,
        pagePath = options.src + '/pages',
        partialPath = options.src + '/partials';

    var pageData = {},
    
        pages = render(pagePath, {});
    grunt.log.writeln(JSON.stringify(pages));
    var layoutSrc = grunt.file.read(layoutPath),
        layout = hogan.compile(layoutSrc, { sectionTags: [{o:'_i', c:'i'}] });

    each(pages, function (pageAndData, name) {
    	var rendered=pageAndData.rendered;
    	var data=pageAndData.data;
    	data.content=rendered;
    	var partialsPageAndData = render(partialPath,data);
    	var partials={
    			content: rendered
    	};
    	each(partialsPageAndData,function(partialPageAndData,partialName){
    		partials[partialName]=partialPageAndData.rendered;
    	});
       var page = layout.render(data,partials);
        grunt.log.writeln("Writing page "+page);
        grunt.file.write(options.dist  + '/' + name + '.html', page);
    });

    function render(path, inheritedData) {

        var pages = {}; 
        var partials = {};
        grunt.file.recurse(path, function (abspath, rootdir, subdir, filename) {

            if (!filename.match(matcher)) return;

            var name = filename.replace(matcher, ''),
                dataPath = abspath.replace(matcher, '.json'),
                locals = merge({}, globals),
                data   = {};

            var templateSrc = grunt.file.read(abspath),
                template = hogan.compile(templateSrc, { sectionTags: [{o:'_i', c:'i'}] });

            if (grunt.file.exists(dataPath)) {
                data = JSON.parse(grunt.file.read(dataPath), function (key, value) {
                    if (value && (typeof value === 'string') && value.indexOf('function') === 0) {
                      try {
                        return new Function('return ' + value)();
                      } catch (ex) {
                        //faulty function, just return it as a raw value
                      }
                    }
                    return value;
                });
                merge(locals, data);
                pageData[name] = locals;
            }

            if (!abspath.match(partialsMatcher)){
            	 grunt.log.writeln("Rendering partials for "+filename);
                 partials = render(partialPath, merge(inheritedData, locals));
            }else{
            	grunt.log.writeln("Do not render partials again");   
            }
            
            grunt.log.writeln("Rendering  "+filename+" as "+name);
            pages[name]={
            		data: locals,
            		rendered: template.render( merge(inheritedData, locals), partials)
            };
           
        });
        return pages;
    }

    function each(obj, iter) {
        var keys = Object.keys(obj);
        for (var i=0,l=keys.length; i<l; i++) {
            iter.call(null, obj[keys[i]], keys[i]);
        }
    }

    function merge(init, extended) {
      each(extended, function(v, k) {
        init[k] = v;
      });

      return init;
    }

  });
};
