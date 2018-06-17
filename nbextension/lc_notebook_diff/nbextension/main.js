define([
  'jquery',
  'base/js/namespace',
  'base/js/utils',
  'require',
  'codemirror/lib/codemirror',
  './jupyter-notebook-diff'
], function(
  $,
  Jupyter,
  utils,
  require,
  CodeMirror,
  JupyterDiff
) {
    "use strict";

    var base_url = utils.get_body_data('baseUrl');
    console.log(JupyterDiff, base_url);

    function createUI() {
      var main = $('<div></div>')
                   .addClass('diff-content-panel');
      var error = $('<div></div>')
                  .attr('id', 'notebook_diff_error');
      var files = $('<div></div>')
                    .addClass('list-group col-xs-12')
                    .appendTo(main);

      for(var i = 0; i < 3; i ++) {
        var fieldName = 'diff-file' + i;
        var displayName = 'File #' + (i + 1).toString();
        files.append($('<div></div>')
                       .addClass('form-group list-group-item col-xs-12')
                       .append($('<label></label>')
                         .attr('for', fieldName)
                         .addClass('col-xs-2')
                         .text(displayName))
                       .append($('<input></input>')
                         .attr('type', 'text')
                         .addClass('col-xs-8')
                         .attr('id', fieldName)));
      }
      files.append($('<div></div>')
                     .addClass('form-group list-group-item col-xs-12')
                     .append($('<button></button>')
                       .attr('id', 'diff-search')
                       .addClass('btn btn-primary col-xs-10')
                       .text('Show diff')));
      main.append($('<div></div>')
                    .attr('id', 'diff-content-container'));

      return $('<div></div>')
                .append(error)
                .append(main);
    }

    function getFilesFromQuery() {
      var url = window.location.search;
      if (! /^\?.+/.test(url)) {
        return {};
      }
      var r = {};
      url.slice(1).split('&').map(function(v) {
        var elem = v.split('=');
        if(elem.length == 2) {
          r[elem[0]] = decodeURIComponent(elem[1]);
        }else{
          console.error('Invalid query', elem);
        }
      });
      return r;
    }

    function showError(message) {
      $('#notebook_diff_error').append($('<div></div>')
                                         .addClass('alert alert-danger')
                                         .text(message));
    }

    function hideError() {
      $('#notebook_diff_error').empty();
    }

    function insertTab () {
        var tab_text = 'Diff';
        var tab_id = 'notebook_diff';

        $('<div/>')
            .attr('id', tab_id)
            .append(createUI())
            .addClass('tab-pane')
            .appendTo('.tab-content');

        var tab_link = $('<a>')
            .text(tab_text)
            .attr('href', '#' + tab_id)
            .attr('data-toggle', 'tab')
            .on('click', function (evt) {
                window.history.pushState(null, null, '#' + tab_id);
            });

        $('<li>')
            .append(tab_link)
            .appendTo('#tabs');
        var query = getFilesFromQuery();
        for(var i = 0; i < 3; i ++) {
          var key = 'diffpath' + (i + 1);
          var fieldName = 'diff-file' + i;
          if (query[key]) {
            $('#' + fieldName).val(query[key]);
          }
        }
        $('#diff-search').click(function() {
          $('#diff-content-container').empty();
          var filenames = [];
          for(var i = 0; i < 3; i ++) {
            var filename = $('#diff-file' + i).val();
            if(filename.trim().length > 0) {
              filenames.push(base_url + 'files/' + filename);
            }
          }
          console.log(filenames);
          if(filenames.length < 2) {
            showError('Two or more filenames required');
          }else{
            hideError();
            $('<div></div>')
              .attr('id', 'diff-content')
              .addClass('jupyter-notebook-diff')
              .appendTo($('#diff-content-container'));
            new JupyterDiff.DiffView($('#diff-content'), CodeMirror, filenames, [],
                                     function(url, jqXHR, textStatus) {
                                       showError('Cannot load ' + url + ': ' + textStatus);
                                     });
          }
        });

        // select tab if hash is set appropriately
        if (window.location.hash == '#' + tab_id) {
            tab_link.click();
        }
    }

    function load_ipython_extension () {
      requirejs.config({
        paths: {
          diff_match_patch: base_url + 'nbextensions/notebook_diff/diff_match_patch'
        }
      });
      require(['codemirror/addon/merge/merge'], function(Merge) {
        // add css first
        $('<link>')
            .attr('rel', 'stylesheet')
            .attr('type', 'text/css')
            .attr('href', require.toUrl('./main.css'))
            .appendTo('head');
        $('<link>')
            .attr('rel', 'stylesheet')
            .attr('type', 'text/css')
            .attr('href', require.toUrl('codemirror/lib/codemirror.css'))
            .appendTo('head');
        $('<link>')
            .attr('rel', 'stylesheet')
            .attr('type', 'text/css')
            .attr('href', require.toUrl('codemirror/addon/merge/merge.css'))
            .appendTo('head');
        $('<link>')
            .attr('rel', 'stylesheet')
            .attr('type', 'text/css')
            .attr('href', require.toUrl('./jupyter-notebook-diff.css'))
            .appendTo('head');

        insertTab();
      });
    }

    return {
        load_ipython_extension : load_ipython_extension
    };

});
