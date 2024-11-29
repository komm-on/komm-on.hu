import * as sass from 'sass'

const unwrapImagesFromParagraphs = ({ tokens }) => {
  for (let i = 1; i + 1 < tokens.length; i++) {
    if (
      tokens[i - 1].type === 'paragraph_open' &&
      tokens[i].type === 'inline' &&
      tokens[i].children[0].type === 'image' &&
      tokens[i + 1].type === 'paragraph_close'
    ) {
      tokens.splice(i - 1, 3, tokens[i])
    }
  }
}

export default (eleventyConfig) => {
  // Set up the CSS preprocessor and its package resolution logic
  eleventyConfig.addTemplateFormats('scss')
  eleventyConfig.addExtension('scss', {
    outputFileExtension: 'css',
    compile: (inputContent) => (_data) =>
      sass.compileString(inputContent, {
        importers: [new sass.NodePackageImporter()],
      }).css,
  })

  eleventyConfig.amendLibrary('md', (md) => {
    // Set default class for tables and wrap them in a responsive container
    md.renderer.rules.table_open = () => `
      <div class="table-responsive">
        <table class="table">
    `
    md.renderer.rules.table_close = () => `
        </table>
      </div>
    `

    // Set default class for images and wrap them into a figure with a caption
    md.renderer.rules.image = (tokens, idx, options, env, self) => {
      tokens[idx].attrJoin('class', 'img-fluid')
      return `
        <figure class="figure">
          ${self.renderToken(tokens, idx, options, env, self)}
          <figcaption class="figure-caption text-center">
            ${tokens[idx].attrGet('title') ?? ''}
          </figcaption>
        </figure>
      `
    }

    // Get rid of the invalid paragraphs and put images at the top level
    md.core.ruler.push(
      'unwrap_images_from_paragraphs',
      unwrapImagesFromParagraphs,
    )
  })

  // Create a filter for adding the `active` class to the currently visited link
  eleventyConfig.addFilter('isActive', function (value) {
    const { url } = this.page
    return (value === '/' ? url === '/' : url.startsWith(value)) ? 'active' : ''
  })

  // Copy the Bootstrap Icons font file
  eleventyConfig.addPassthroughCopy({
    'node_modules/bootstrap-icons/font/fonts/bootstrap-icons.woff2':
      'assets/fonts/bootstrap-icons.woff2',
  })

  // Copy the Bootstrap JavaScript file
  eleventyConfig.addPassthroughCopy({
    'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js':
      'assets/scripts/bootstrap.bundle.min.js',
  })

  // Copy all static assets
  eleventyConfig.addPassthroughCopy('src/assets')

  return { dir: { input: 'src', layouts: 'layouts', output: 'dst' } }
}
