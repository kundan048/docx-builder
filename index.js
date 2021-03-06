var fs = require('fs');
var Docxtemplater = require('docxtemplater');
var JSZip = require('jszip');

var systemXmlRelIds = 
{	
	"styles.xml" : "rId1",
	"settings.xml" : "rId2",
	"webSettings.xml" : "rId3",
	"footnotes.xml" : "rId4",
	"endnotes.xml" : "rId5",
	"header1.xml" : "rId6",
	"footer1.xml" : "rId7",
	"fontTable.xml" : "rId8",
	"theme1.xml" : "rId9"
}

exports.Document = function() {
	
	this._body = [];
	this._header = [];
	this._footer = [];
	this._builder = this._body;
    this._bold = false;
	this._italic = false;
	this._underline = false;
	this._font = null;
	this._size = null;
	this._alignment = null;
	
	
	this.beginHeader = function() 
	{
		this._builder = this._header;
	}
	
	this.endHeader = function()
	{
		this._builder = this._body;
	}
	
	this.beginFooter = function() 
	{
		this._builder = this._footer;
	}
	
	this.endFooter = function()
	{
		this._builder = this._body;
	}
	
	this.setBold = function(){
		this._bold = true;
	}
	
	this.unsetBold = function(){
		this._bold = false;
	}
	
	this.setItalic = function(){
		
		this._italic = true;
	}
	
	this.unsetItalic = function(){
		
		this._italic = false;
	}
	
	this.setUnderline = function(){
		
		this._underline = true;
	}
	
	this.unsetUnderline = function(){
		
		this._underline = false;
	}
	
	this.setFont = function(font){
		this._font = font;
	}
	
	this.unsetFont = function() {
		this._font = null;
	}
	
	this.setSize = function(size){
		this._size = size;
	}
	
	this.unsetSize = function(){
		this._size = null;
	}
	
	this.rightAlign = function(){
		this._alignment = "right";
	}
	
	this.centerAlign = function(){
		this._alignment = "center";
	}
	
	this.leftAlign = function(){
		this._alignment = null;
	}
	
	this.insertPageBreak = function()
	{
		var pb = '<w:p> \
					<w:r> \
						<w:br w:type="page"/> \
					</w:r> \
				  </w:p>';
				  
		this._builder.push(pb);
	}
	
	this.beginTable = function(options){
		
		if(!options)
		{
			this._builder.push('<w:tbl>');
		}
		else
		{
			options = options || { borderSize: 4, borderColor: 'auto' };
			this._builder.push('<w:tbl><w:tblPr><w:tblBorders> \
				<w:top w:val="single" w:space="0" w:color="' + options.borderColor + '" w:sz="' + options.borderSize + '"/> \
				<w:left w:val="single" w:space="0" w:color="' + options.borderColor + '" w:sz="' + options.borderSize + '"/> \
				<w:bottom w:val="single" w:space="0" w:color="' + options.borderColor + '" w:sz="' + options.borderSize + '"/> \
				<w:right w:val="single" w:space="0" w:color="' + options.borderColor + '" w:sz="' + options.borderSize + '"/> \
				<w:insideH w:val="single" w:space="0" w:color="' + options.borderColor + '" w:sz="' + options.borderSize + '"/> \
				<w:insideV w:val="single" w:space="0" w:color="' + options.borderColor + '" w:sz="' + options.borderSize + '"/> \
				</w:tblBorders>	\
			</w:tblPr>');
		}
	}
	
	this.insertRow = function(){
		
		this._builder.push('<w:tr><w:tc>');
	}
	
	this.nextColumn = function(){
		this._builder.push('</w:tc><w:tc>');
	}
	
	this.nextRow = function(){
		this._builder.push('</w:tc></w:tr><w:tr><w:tc>');
	}
	
	this.endTable = function(){
		this._builder.push('</w:tc></w:tr></w:tbl>');
	}
	
    this.insertText = function(text) {
		
		var p = '<w:p>' +
		
			(this._alignment ? ('<w:pPr><w:jc w:val="' + this._alignment + '"/></w:pPr>') : '') +
			
			'<w:r> \
				<w:rPr>' +
				
				    (this._size ? ('<w:sz w:val="' + this._size + '"/>') : "") +
					(this._bold ? '<w:b/>' : "") +
					(this._italic ? '<w:i/>' : "") +
					(this._underline ? '<w:u w:val="single"/>' : "") +
					(this._font ? ('<w:rFonts w:hAnsi="' + this._font + '" w:ascii="' + this._font + '"/>') : "")					
					
					+
				'</w:rPr> \
				<w:t>[CONTENT]</w:t> \
			</w:r> \
		</w:p>'
		
        this._builder.push(p.replace("[CONTENT]", text));
    }
	
	this.insertRaw = function(xml){
		
		this._builder.push(xml);
	}
	
	this._replaceRIds = function(xml, replacements)
	{
		var xmlBuilder = [];
	    var startingIndex = 0;
		for(var i=0; i < xml.length; i++)
		{
		    if(xml[i] == '"' && xml[i+1] == 'r' && xml[i+2] == 'I' && xml[i+3] == 'd')
		    {
				var oldRId = ["rId"];
				i = i+4;
				while(xml[i] != "\"")
				{
					oldRId.push(xml[i]);
				    i++;
				}
			   
				oldRId = oldRId.join("");
				var newRId = replacements[oldRId] || oldRId;
			   
				xmlBuilder.push('"');
				xmlBuilder.push(newRId);
				xmlBuilder.push('"');
			   
			}
			else 
				xmlBuilder.push(xml[i]);
	    }
	   
		return xmlBuilder.join("");
	}
	
	this._utf8ArrayToString = function(array) {
		var out, i, len, c;
		var char2, char3;

		out = "";
		len = array.length;
		i = 0;
		while(i < len) {
		c = array[i++];
		switch(c >> 4)
		{ 
		  case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
			// 0xxxxxxx
			out += String.fromCharCode(c);
			break;
		  case 12: case 13:
			// 110x xxxx   10xx xxxx
			char2 = array[i++];
			out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
			break;
		  case 14:
			// 1110 xxxx  10xx xxxx  10xx xxxx
			char2 = array[i++];
			char3 = array[i++];
			out += String.fromCharCode(((c & 0x0F) << 12) |
						   ((char2 & 0x3F) << 6) |
						   ((char3 & 0x3F) << 0));
			break;
		}
		}

		return out;
	}
	
	this.rels = [];
	
	this.getExternalDocxRawXml = function(docxData)
	{
		var zip = new JSZip(docxData);
	    
		var xml = this._utf8ArrayToString(zip.file("word/document.xml")._data.getContent());
		xml = xml.substring(xml.indexOf("<w:body>") + 8);
        xml = xml.substring(0, xml.indexOf("</w:body>"));
		
		var relsXml = this._utf8ArrayToString(zip.file("word/_rels/document.xml.rels")._data.getContent());
	    var replacements = null;
		
		while(relsXml.indexOf("<Relationship") != -1)
		{
			relsXml = relsXml.substring(relsXml.indexOf("<Relationship") + 13);
			relsXml = relsXml.substring(relsXml.indexOf("Id=\"") + 4);
			var id = relsXml.substring(0, relsXml.indexOf("\""));
			relsXml = relsXml.substring(relsXml.indexOf("Type=\"") + 6);
			var type = relsXml.substring(0, relsXml.indexOf("\""));
			relsXml = relsXml.substring(relsXml.indexOf("Target=\"") + 8);
			var target = relsXml.substring(0, relsXml.indexOf("\""));
			
			var filename = target.indexOf("/") != -1 ? target.substring(target.lastIndexOf("/")+1) : target;
			var zipPath = target.startsWith("../") ? target.substring(3) : ("word/" + target);

			var newId = systemXmlRelIds[filename];
			var newTarget = target;
			
			if(!newId)
			{
				var hrtime = process.hrtime();
				var rand = hrtime[0] + "" + hrtime[1];
				newId = id + "_" + rand;
				newTarget = target.split('/');
				newTarget[newTarget.length-1] = rand + "_" + newTarget[newTarget.length-1]; 
				newTarget = newTarget.join('/');
			}

			this.rels.push({ 
				id: id, 
				newId: newId,
				data: zip.file(zipPath)._data.getContent(), 
				zipPath: zipPath,
				filename: filename,
				type: type, 
				target: target, 
				newTarget: newTarget
			}); 
			
			replacements = replacements || {};
			replacements[id] = newId;
		}
	
		
		if(replacements)
			xml = this._replaceRIds(xml, replacements);
		
		return xml;
	}
	
	this.insertDocxSync = function(path){
		
		var xml = this.getExternalDocxRawXml(fs.readFileSync(path,"binary"));
		this.insertRaw(xml);
	}
	
	this.insertDocx = function(path, callback){
		
		fs.readFile(path, "binary", (e, data) => {
		  if (e) callback(e);
		  else
		  {
			var xml = this.getExternalDocxRawXml(data);
			this.insertRaw(xml);
			callback(null);
		  }
		});
	}
	
	this.save = function(filepath, err){
		
		var template = fs.readFileSync(__dirname + "/template.docx","binary");
		var zip = new JSZip(template);
		var filesToSave = {};
		
		if(this.rels.length > 0)
		{
			var relsXmlBuilder = [];
			
			for(var i=0; i < this.rels.length; i++)
			{
				var rel = this.rels[i];
				var saveTo = rel.newTarget.startsWith("../") ? rel.newTarget.substring(3) : ("word/" + rel.newTarget);
				
				if(rel.target != rel.newTarget)
				{
					zip.file(saveTo, rel.data);
					relsXmlBuilder.push('<Relationship Id="' + rel.newId + '" Type="' + rel.type + '" Target="' + rel.newTarget + '"/>');
				}
				else if(rel.filename.endsWith(".xml")) 
				{
					var zipFile = zip.file(rel.zipPath);
					
					if((filesToSave[saveTo] || zipFile) && !rel.target.startsWith('theme/'))
					{
						var xml = this._utf8ArrayToString(rel.data).substring(1);
						xml = xml.substring(xml.indexOf("<"));
						xml = xml.substring(xml.indexOf(">") + 1);
						
						var closingTag = xml.substring(xml.lastIndexOf("</"));
						
						var mergedXml = filesToSave[saveTo] || this._utf8ArrayToString(zipFile._data.getContent());
						mergedXml = mergedXml.replace(closingTag, xml);
						filesToSave[saveTo] = mergedXml;
					}
					else
						filesToSave[saveTo] = this._utf8ArrayToString(rel.data);
				}
				else
					console.log("Cannot merge file " + filename);
			}
			
			if(relsXmlBuilder.length > 0)
			{
				var relsXml = this._utf8ArrayToString(zip.file("word/_rels/document.xml.rels")._data.getContent());
				relsXmlBuilder.push('</Relationships>');
				relsXml = relsXml.replace('</Relationships>', relsXmlBuilder.join(''));
				zip.file("word/_rels/document.xml.rels", relsXml);
			}
			
			for(var path in filesToSave)
			{
				zip.file(path, filesToSave[path]);
			}
		}
		
		var doc = new Docxtemplater().loadZip(zip);

		doc.setData({body: this._body.join(''), header: this._header.join(''), footer: this._footer.join('') });
		doc.render();
		
		var buf = doc.getZip().generate({type:"nodebuffer"});
		fs.writeFile(filepath,buf, err);
	}
}