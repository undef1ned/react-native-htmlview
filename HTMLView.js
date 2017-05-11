var React = require('react')
var ReactNative = require('react-native')
var htmlToElement = require('./htmlToElement')
var {
    Linking,
    StyleSheet,
    Text,
    View
} = ReactNative


var HTMLView = React.createClass({
    propTypes: {
        value: React.PropTypes.string,
        stylesheet: React.PropTypes.object,
        onLinkPress: React.PropTypes.func,
        onError: React.PropTypes.func,
        renderNode: React.PropTypes.func,
    },

    getDefaultProps() {
        return {
            onLinkPress: (url) => {
                Linking.canOpenURL(url).then(supported => {
                    if (!supported) {
                    } else {
                        return Linking.openURL(url);
                    }
                }).catch(err => {});
            },
            onError: console.error.bind(console),
        }
    },

    getInitialState() {
        return {
            element: null,
        }
    },

    componentWillReceiveProps(nextProps) {
        if (this.props.value !== nextProps.value) {
            this.startHtmlRender(nextProps.value)
        }
    },

    componentDidMount() {
        this.mounted = true
        this.startHtmlRender(this.props.value)
    },

    componentWillUnmount() {
        this.mounted = false
    },

    startHtmlRender(value) {
        if (!value) return this.setState({element: null})

        var opts = {
            linkHandler: this.props.onLinkPress,
            styles: Object.assign({}, baseStyles, this.props.stylesheet),
            customRenderer: this.props.renderNode,
            navigator: this.props.navigator
        }

        htmlToElement(value, opts, (err, element) => {
            if (err) return this.props.onError(err)

            if (this.mounted) {
                let index = 0;
                let groupedElement = [];
                let group = []
                element.forEach((node, index) => {
                    if (Array.isArray(node)){
                        node = node[0]
                    }
                    if (node && node.props && node.props.isImage == 'true'){
                        groupedElement.push(group)
                        group = []
                        groupedElement.push(node)
                    } else {
                        group.push(node)
                    }
                })
                if (group.length){
                    groupedElement.push(group)
                }
                this.setState({
                    element: groupedElement
                })
            }
        })
    },

    render() {
        if (this.state.element) {
            return (
                <View style={{
                    flexDirection: 'column',
                    alignSelf: 'stretch',
                    //flex: 1
                }}>
                {
                    this.state.element.map((group, i) => {
                        if (Array.isArray(group)){
                            return <Text children={group} />
                        } else {
                            return group
                        }
                    })
                }
                </View>
            )
        }
        return <View />
    },
})

var boldStyle = {fontWeight: '500'}
var italicStyle = {fontStyle: 'italic'}
var codeStyle = {fontFamily: 'Menlo'}

var baseStyles = StyleSheet.create({
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
