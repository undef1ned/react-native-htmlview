var React = require('react')
var ReactNative = require('react-native')
var htmlparser = require('./vendor/htmlparser2')
var entities = require('./vendor/entities')

var {
    Text,
    Image,
} = ReactNative

import FitImage from 'react-native-fit-image'


var LINE_BREAK = '\n'
var PARAGRAPH_BREAK = '\n\n'
var BULLET = '\u2022 '

function htmlToElement(rawHtml, opts, done) {
    function domToElement(dom, parent) {
        if (!dom) return null

        return dom.map((node, index, list) => {
            if (opts.customRenderer) {
                var rendered = opts.customRenderer(node, index, list)
                if (rendered || rendered === null) return rendered
            }

            if (node.type == 'text') {
                return (
                    <Text
                        key={index}
                        style={parent ? opts.styles[parent.name] : opts.styles.text}
                    >
                    {entities.decodeHTML(node.data)}
                    </Text>
                )
            }

            if (node.type == 'tag') {
                if (node.name == 'a' && node.attribs && node.attribs.href) {
                    return (
                        <Text
                            key={index}
                            onPress={() => {
                                opts.linkHandler(entities.decodeHTML(node.attribs.href))
                            }
                        }>
                            {domToElement(node.children, node)}
                        </Text>
                    )
                }

                if (node.name == 'img') {
                    if (node.attribs.class === 'smiley'){
                        return (
                            <Image
                                key={index}
                                source={{uri: node.attribs.src}}
                                style={opts.styles.smiley}
                                resizeMode="contain"
                            />
                        )
                    } else {
                        return (
                            <FitImage
                                originalWidth={parseInt(node.attribs['hbx-width'], 10)}
                                originalHeight={parseInt(node.attribs['hbx-height'], 10)}
                                key={index}
                                source={{uri: node.attribs.src}}
                                resizeMode="contain"
                            />
                        )
                    }
                }

                return (
                    domToElement(node.children, node)
                )
            }
        }
    )}

    var handler = new htmlparser.DomHandler(function(err, dom) {
        if (err) done(err)
        done(null, domToElement(dom))
    })
    var parser = new htmlparser.Parser(handler)
    parser.write(rawHtml)
    parser.done()
}

module.exports = htmlToElement
