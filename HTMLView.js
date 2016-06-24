import htmlparser from './vendor/htmlparser2'
import entities from './vendor/entities'
import React from 'react'
import PureRenderMixin from 'react-addons-pure-render-mixin'
import FitImage from 'react-native-fit-image'
import Lightbox from 'react-native-lightbox'
import {
    Linking,
    StyleSheet,
    Text,
    Image,
    View,
    TouchableWithoutFeedback
} from 'react-native'

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
                                console.log('onpress')
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
                    <View key={index}>
                        {node.name == 'pre' ? LINE_BREAK : null}
                        {node.name == 'li' ? BULLET : null}
                        {domToElement(node.children, node)}
                        {node.name == 'br' || node.name == 'li' ? LINE_BREAK : null}
                        {node.name == 'p' && index < list.length-1 ? PARAGRAPH_BREAK : null}
                        {node.name == 'h1' || node.name == 'h2' || node.name == 'h3' || node.name == 'h4' || node.name == 'h5' ? PARAGRAPH_BREAK : null}
                    </View>
                )
            }
        })
    }

    // <Lightbox underlayColor="white" navigator={opts.navigator}>
    //
    // </Lightbox>

    var handler = new htmlparser.DomHandler(function (err, dom) {
        if (err) done(err)
        done(null, domToElement(dom))
    })
    var parser = new htmlparser.Parser(handler)
    parser.write(rawHtml)
    parser.done()
}

var HTMLView = React.createClass({
    mixins: [
        PureRenderMixin
    ],
    getDefaultProps() {
        return {
            onLinkPress: (url) => {
                Linking.canOpenURL(url).then(supported => {
                    if (!supported) {
                        console.log('Can\'t handle url: ' + url);
                    } else {
                        return Linking.openURL(url);
                    }
                }).catch(err => console.error('An error occurred', err));
            },
        }
    },
    getInitialState() {
        return {
            element: null,
        }
    },
    componentWillReceiveProps() {
        if (this.state.element) return
        this.startHtmlRender()
    },
    componentDidMount() {
        this.startHtmlRender()
    },
    startHtmlRender() {
        if (!this.props.value) return
        if (this.renderingHtml) return

        var opts = {
            linkHandler: this.props.onLinkPress,
            styles: Object.assign({}, baseStyles, this.props.stylesheet),
            customRenderer: this.props.renderNode,
            navigator: this.props.navigator
        }

        this.renderingHtml = true
        htmlToElement(this.props.value, opts, (err, element) => {
            this.renderingHtml = false

            if (err) return (this.props.onError || console.error)(err)

            if (this.isMounted()) this.setState({element})
        })
    },
    render() {
        if (this.state.element) {
            return <View children={this.state.element} />
        }
        return <View />
    }
})

var boldStyle = {fontWeight: '500'}
var italicStyle = {fontStyle: 'italic'}
var codeStyle = {fontFamily: 'Menlo'}

var baseStyles = StyleSheet.create({
    text: {
        color: '#FFFFFF'
    },
    b: boldStyle,
    strong: boldStyle,
    i: italicStyle,
    em: italicStyle,
    pre: codeStyle,
    code: codeStyle,
    a: {
        fontWeight: '500',
        color: '#007AFF',
    },
})

module.exports = HTMLView
