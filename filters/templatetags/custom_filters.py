from django import template

register = template.Library()

def split_gate(value):
    """Removes all values of arg from the given string"""
    return value.split('Gate')[0]

def split_node(value):
    """Removes all values of arg from the given string"""
    return value.split('Node')[0]

register.filter('split_gate', split_gate)
register.filter('split_node', split_node)