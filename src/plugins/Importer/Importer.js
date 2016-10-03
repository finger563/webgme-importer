/*globals define*/
/*jshint node:true, browser:true*/

/**
 * Generated by PluginGenerator 1.7.0 from webgme on Sun Oct 02 2016 11:36:08 GMT-0500 (Central Daylight Time).
 * A plugin that inherits from the PluginBase. To see source code documentation about available
 * properties and methods visit %host%/docs/source/PluginBase.html.
 */

define([
    'plugin/PluginConfig',
    'text!./metadata.json',
    'plugin/PluginBase',
    'importer/modelImporter',
    'q'
], function (
    PluginConfig,
    pluginMetadata,
    PluginBase,
    modelImporter,
    Q) {
    'use strict';

    pluginMetadata = JSON.parse(pluginMetadata);

    /**
     * Initializes a new instance of Importer.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin Importer.
     * @constructor
     */
    var Importer = function () {
        // Call base class' constructor.
        PluginBase.call(this);
        this.pluginMetadata = pluginMetadata;
    };

    /**
     * Metadata associated with the plugin. Contains id, name, version, description, icon, configStructue etc.
     * This is also available at the instance at this.pluginMetadata.
     * @type {object}
     */
    Importer.metadata = pluginMetadata;

    // Prototypical inheritance from PluginBase.
    Importer.prototype = Object.create(PluginBase.prototype);
    Importer.prototype.constructor = Importer;

    Importer.prototype.notify = function(level, msg) {
	var self = this;
	var prefix = self.projectId + '::' + self.projectName + '::' + level + '::';
	if (level=='error')
	    self.logger.error(msg);
	else if (level=='debug')
	    self.logger.debug(msg);
	else if (level=='info')
	    self.logger.info(msg);
	else if (level=='warning')
	    self.logger.warn(msg);
	self.createMessage(self.activeNode, msg, level);
	self.sendNotification(prefix+msg);
    };

    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(string, plugin.PluginResult)} callback - the result callback
     */
    Importer.prototype.main = function (callback) {
        // Use self to access core, project, result, logger etc from PluginBase.
        // These are all instantiated at this point.
        var self = this;
        self.result.success = false;

	self.metaTypes = {};
        self.updateMETA(self.metaTypes);

	// What did the user select for our configuration?
	var currentConfig = self.getCurrentConfig();
	self.modelHash = currentConfig.modelHash;
	
	modelImporter.notify = function(level, msg) {self.notify(level, msg);}

	return self.blobClient.getMetadata(self.modelHash)
	    .then((modelMetadata) => {
		self.modelName = modelMetadata.name;
		return self.blobClient.getObjectAsString(self.modelHash);
	    })
	    .then((modelString) => {
		var modelJSON = JSON.parse(modelString);
		return modelImporter.importModel(self.core, self.META, modelJSON, self.activeNode)
	    })
	    .then(function() {
		// This will save the changes. If you don't want to save;
		self.notify('info','Loaded ' + self.modelName + ', saving updates.');
		return self.save('Imported ' + self.modelName);
	    })
	    .then(function (err) {
		if (err.status != 'SYNCED') {
		    throw new String('Couldnt write to model!');
		}
		self.result.setSuccess(true);
		callback(null, self.result);
	    })
	    .catch(function(err) {
        	self.notify('error', err);
		self.result.setSuccess(false);
		callback(err, self.result);
	    })
		.done();
    };

    return Importer;
});
