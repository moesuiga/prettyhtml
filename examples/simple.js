const prettyhtml = require('./../packages/prettyhtml')

// example with angular template
const result = prettyhtml(`<!-- prettyhtml-ignore -->
<div class="form-check"><label class="form-check-label"><input type="checkbox" class="form-check-input"> Check me out</label></div>
<div class="form-check"><label class="form-check-label"><input type="checkbox" class="form-check-input"> Check me out</label></div>
<!-- prettyhtml-ignore -->
<ul><!--
--><li>   First   </li><!--
--><li>   Second   </li><!--
--></ul>`)

console.log(result.contents)
